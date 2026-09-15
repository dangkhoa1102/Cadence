use std::fs::File;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};

use crate::ExitAllowed;

const GITHUB_REPO: &str = "dangkhoa1102/Cadence";
const PROGRESS_EVENT: &str = "update-progress";

pub struct UpdateCancel(pub AtomicBool);

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub current: String,
    pub latest: String,
    pub notes: String,
    pub download_url: Option<String>,
    pub has_update: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProgress {
    pub received: u64,
    pub total: Option<u64>,
}

#[derive(Deserialize)]
struct GithubRelease {
    tag_name: String,
    name: Option<String>,
    body: Option<String>,
    html_url: Option<String>,
    published_at: Option<String>,
    #[serde(default)]
    prerelease: bool,
    #[serde(default)]
    assets: Vec<GithubAsset>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseNote {
    pub version: String,
    pub name: String,
    pub notes: String,
    pub published_at: Option<String>,
    pub html_url: Option<String>,
    pub prerelease: bool,
}

#[derive(Deserialize)]
struct GithubAsset {
    name: String,
    browser_download_url: String,
}

pub fn normalize_version(raw: &str) -> String {
    raw.trim().trim_start_matches('v').trim_start_matches('V').to_string()
}

pub fn parse_version(raw: &str) -> Option<(u64, u64, u64)> {
    let normalized = normalize_version(raw);
    let mut parts = normalized.split('.');
    let major = parts.next()?.parse().ok()?;
    let minor = parts.next().unwrap_or("0").parse().ok()?;
    let patch_raw = parts.next().unwrap_or("0");
    let patch = patch_raw
        .chars()
        .take_while(|c| c.is_ascii_digit())
        .collect::<String>()
        .parse()
        .ok()?;
    Some((major, minor, patch))
}

pub fn version_cmp(left: &str, right: &str) -> Option<std::cmp::Ordering> {
    Some(parse_version(left)?.cmp(&parse_version(right)?))
}

pub fn is_newer(latest: &str, current: &str) -> bool {
    matches!(version_cmp(latest, current), Some(std::cmp::Ordering::Greater))
}

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent(format!(
            "Cadence/{} (+https://github.com/{GITHUB_REPO})",
            env!("CARGO_PKG_VERSION")
        ))
        .connect_timeout(Duration::from_secs(20))
        .build()
        .map_err(|err| format!("network|{err}"))
}

fn installer_url(release: &GithubRelease) -> Option<String> {
    release
        .assets
        .iter()
        .find(|asset| {
            let name = asset.name.to_ascii_lowercase();
            name.ends_with(".exe") && name.contains("setup")
        })
        .map(|asset| asset.browser_download_url.clone())
}

#[tauri::command]
pub async fn check_for_update(app: AppHandle) -> Result<UpdateInfo, String> {
    let current = app.package_info().version.to_string();
    let url = format!("https://api.github.com/repos/{GITHUB_REPO}/releases/latest");
    let response = http_client()?
        .get(url)
        .header("Accept", "application/vnd.github+json")
        .timeout(Duration::from_secs(30))
        .send()
        .await
        .map_err(|err| format!("network|{err}"))?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!("github|{status} {body}"));
    }

    let release: GithubRelease = response
        .json()
        .await
        .map_err(|err| format!("github|{err}"))?;
    let latest = normalize_version(&release.tag_name);
    let notes = release.body.clone().unwrap_or_default();
    let download_url = installer_url(&release);
    if download_url.is_none() && is_newer(&latest, &current) {
        return Err("no_installer|Bản phát hành không có file Cadence_*_x64-setup.exe.".into());
    }

    Ok(UpdateInfo {
        has_update: is_newer(&latest, &current),
        current,
        latest,
        notes,
        download_url,
    })
}

#[tauri::command]
pub async fn list_app_releases() -> Result<Vec<ReleaseNote>, String> {
    let url = format!("https://api.github.com/repos/{GITHUB_REPO}/releases?per_page=30");
    let response = http_client()?
        .get(url)
        .header("Accept", "application/vnd.github+json")
        .timeout(Duration::from_secs(30))
        .send()
        .await
        .map_err(|err| format!("network|{err}"))?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!("github|{status} {body}"));
    }

    let releases: Vec<GithubRelease> = response
        .json()
        .await
        .map_err(|err| format!("github|{err}"))?;

    Ok(releases
        .into_iter()
        .map(|release| {
            let version = normalize_version(&release.tag_name);
            ReleaseNote {
                name: release
                    .name
                    .filter(|value| !value.trim().is_empty())
                    .unwrap_or_else(|| format!("Cadence {version}")),
                notes: release.body.unwrap_or_default(),
                published_at: release.published_at,
                html_url: release.html_url,
                prerelease: release.prerelease,
                version,
            }
        })
        .collect())
}

#[tauri::command]
pub fn cancel_app_update(cancel: State<UpdateCancel>) {
    cancel.0.store(true, Ordering::Relaxed);
}

#[tauri::command]
pub async fn start_app_update(
    app: AppHandle,
    cancel: State<'_, UpdateCancel>,
    url: String,
    version: String,
) -> Result<(), String> {
    if url.is_empty() {
        return Err("no_installer|Thiếu đường dẫn file cài đặt.".into());
    }
    cancel.0.store(false, Ordering::Relaxed);

    let setup_path = download_installer(&app, &cancel, &url).await?;
    if cancel.0.load(Ordering::Relaxed) {
        let _ = std::fs::remove_file(&setup_path);
        return Err("cancelled|Đã hủy tải.".into());
    }

    spawn_installer_and_exit(&app, &setup_path, &version)
}

async fn download_installer(
    app: &AppHandle,
    cancel: &State<'_, UpdateCancel>,
    url: &str,
) -> Result<PathBuf, String> {
    let path = std::env::temp_dir().join("Cadence_update_setup.exe");
    let response = http_client()?
        .get(url)
        .timeout(Duration::from_secs(600))
        .send()
        .await
        .map_err(|err| format!("network|{err}"))?;
    let status = response.status();
    if !status.is_success() {
        return Err(format!("download|HTTP {status} khi tải file cài đặt."));
    }

    let total = response.content_length();
    let mut file = File::create(&path).map_err(|err| format!("io|{err}"))?;
    let mut received: u64 = 0;
    let mut last_emit = 0_u64;
    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        if cancel.0.load(Ordering::Relaxed) {
            drop(file);
            let _ = std::fs::remove_file(&path);
            return Err("cancelled|Đã hủy tải.".into());
        }
        let bytes = chunk.map_err(|err| format!("download|{err}"))?;
        file.write_all(&bytes).map_err(|err| format!("io|{err}"))?;
        received += bytes.len() as u64;
        if received - last_emit >= 256 * 1024 || total == Some(received) {
            let _ = app.emit(
                PROGRESS_EVENT,
                UpdateProgress {
                    received,
                    total,
                },
            );
            last_emit = received;
        }
    }
    file.flush().map_err(|err| format!("io|{err}"))?;
    let _ = app.emit(
        PROGRESS_EVENT,
        UpdateProgress {
            received,
            total: total.or(Some(received)),
        },
    );
    Ok(path)
}

fn spawn_installer_and_exit(app: &AppHandle, setup: &Path, _version: &str) -> Result<(), String> {
    let local = std::env::var("LOCALAPPDATA")
        .map_err(|err| format!("spawn|Không đọc được LOCALAPPDATA: {err}"))?;
    let launch = PathBuf::from(local).join("Cadence").join("cadence.exe");
    let setup_s = setup.display().to_string().replace('"', "");
    let launch_s = launch.display().to_string().replace('"', "");
    let cmdline = format!(
        r#"timeout /t 3 /nobreak >nul & "{setup_s}" /S & start "" "{launch_s}""#
    );

    let mut cmd = std::process::Command::new("cmd");
    cmd.args(["/C", &cmdline]);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const DETACHED_PROCESS: u32 = 0x00000008;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        const CREATE_BREAKAWAY_FROM_JOB: u32 = 0x01000000;
        cmd.creation_flags(DETACHED_PROCESS | CREATE_NO_WINDOW | CREATE_BREAKAWAY_FROM_JOB);
    }

    cmd.spawn()
        .map_err(|err| format!("spawn|Không chạy được trình cài đặt: {err}"))?;

    app.state::<ExitAllowed>()
        .0
        .store(true, Ordering::Relaxed);
    app.exit(0);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn newer_versions_compare() {
        assert!(is_newer("0.1.2", "0.1.1"));
        assert!(is_newer("v0.2.0", "0.1.9"));
        assert!(!is_newer("0.1.1", "0.1.1"));
        assert!(!is_newer("0.1.0", "0.1.1"));
        assert_eq!(normalize_version("v0.1.2"), "0.1.2");
    }

    #[test]
    fn picks_nsis_installer() {
        let release = GithubRelease {
            tag_name: "v0.1.2".into(),
            name: None,
            body: None,
            html_url: None,
            published_at: None,
            prerelease: false,
            assets: vec![
                GithubAsset {
                    name: "source.zip".into(),
                    browser_download_url: "https://example.com/source.zip".into(),
                },
                GithubAsset {
                    name: "Cadence_0.1.2_x64-setup.exe".into(),
                    browser_download_url: "https://example.com/setup.exe".into(),
                },
            ],
        };
        assert_eq!(
            installer_url(&release).as_deref(),
            Some("https://example.com/setup.exe")
        );
    }
}
