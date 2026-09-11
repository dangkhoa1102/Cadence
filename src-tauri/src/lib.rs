use std::sync::atomic::{AtomicBool, Ordering};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{
    menu::{Menu, MenuItem},
    Manager, WindowEvent,
};
use tauri_plugin_sql::{Migration, MigrationKind};

struct ExitAllowed(AtomicBool);

#[cfg(windows)]
mod win_alert {
    use std::os::windows::ffi::OsStrExt;
    use std::path::Path;
    use std::ptr;
    use std::thread;
    use std::time::{Duration, Instant};

    /// How long the alert keeps sounding for a single reminder.
    const ALERT_DURATION: Duration = Duration::from_secs(3);

    #[link(name = "winmm")]
    extern "system" {
        fn PlaySoundW(psz_sound: *const u16, hmod: isize, fdw_sound: u32) -> i32;
    }

    #[link(name = "user32")]
    extern "system" {
        fn MessageBeep(u_type: u32) -> i32;
    }

    fn to_wide(path: &Path) -> Vec<u16> {
        path.as_os_str()
            .encode_wide()
            .chain(std::iter::once(0))
            .collect()
    }

    pub fn play() {
        const SND_ASYNC: u32 = 0x0001;
        const SND_NODEFAULT: u32 = 0x0002;
        const SND_LOOP: u32 = 0x0008;
        const SND_FILENAME: u32 = 0x00020000;
        const MB_ICONEXCLAMATION: u32 = 0x00000030;

        let candidates = [
            r"C:\Windows\Media\Windows Notify Calendar.wav",
            r"C:\Windows\Media\Alarm01.wav",
            r"C:\Windows\Media\Windows Notify.wav",
        ];

        let looping = candidates.iter().any(|path| {
            let wide = to_wide(Path::new(path));
            unsafe {
                PlaySoundW(
                    wide.as_ptr(),
                    0,
                    SND_FILENAME | SND_ASYNC | SND_LOOP | SND_NODEFAULT,
                ) != 0
            }
        });

        thread::spawn(move || {
            if looping {
                thread::sleep(ALERT_DURATION);
                unsafe {
                    PlaySoundW(ptr::null(), 0, 0);
                }
                return;
            }

            let end = Instant::now() + ALERT_DURATION;
            while Instant::now() < end {
                unsafe {
                    MessageBeep(MB_ICONEXCLAMATION);
                }
                thread::sleep(Duration::from_millis(600));
            }
        });
    }
}

/// Kích thước cửa sổ mong muốn có thể lớn hơn vùng làm việc của màn hình
/// (nhất là khi bật scaling), làm cửa sổ tràn xuống taskbar. Thu lại cho vừa.
fn fit_to_work_area(window: &tauri::WebviewWindow) {
    const MARGIN: f64 = 24.0;
    const MIN_WIDTH: f64 = 720.0;
    const MIN_HEIGHT: f64 = 640.0;

    // Windows có thể mở app ở trạng thái maximize theo tiến trình gọi nó.
    let _ = window.unmaximize();

    let Ok(Some(monitor)) = window.current_monitor() else {
        return;
    };
    let (Ok(outer), Ok(inner)) = (window.outer_size(), window.inner_size()) else {
        return;
    };

    let scale = monitor.scale_factor();
    let work = monitor.work_area();
    let chrome_w = outer.width.saturating_sub(inner.width) as f64 / scale;
    let chrome_h = outer.height.saturating_sub(inner.height) as f64 / scale;
    let max_w = (work.size.width as f64 / scale - chrome_w - MARGIN).max(MIN_WIDTH);
    let max_h = (work.size.height as f64 / scale - chrome_h - MARGIN).max(MIN_HEIGHT);

    let cur_w = inner.width as f64 / scale;
    let cur_h = inner.height as f64 / scale;
    if cur_w > max_w || cur_h > max_h {
        let _ = window.set_size(tauri::LogicalSize::new(cur_w.min(max_w), cur_h.min(max_h)));
    }
    let _ = window.center();
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[tauri::command]
fn raise_alert(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.request_user_attention(Some(tauri::UserAttentionType::Informational));
    }
    #[cfg(windows)]
    win_alert::play();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_initial_tables",
        sql: r#"
            CREATE TABLE IF NOT EXISTS tasks (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              notes TEXT NOT NULL DEFAULT '',
              priority INTEGER NOT NULL DEFAULT 1,
              sort_order INTEGER NOT NULL DEFAULT 0,
              archived INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS completions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              task_id INTEGER NOT NULL,
              completed_on TEXT NOT NULL,
              UNIQUE(task_id, completed_on)
            );

            CREATE TABLE IF NOT EXISTS settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_completions_day ON completions(completed_on);
            CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived);
        "#,
        kind: MigrationKind::Up,
    },
    Migration {
        version: 2,
        description: "add_due_time",
        sql: "ALTER TABLE tasks ADD COLUMN due_time TEXT;",
        kind: MigrationKind::Up,
    },
    Migration {
        version: 3,
        description: "add_weekdays",
        sql: "ALTER TABLE tasks ADD COLUMN weekdays TEXT NOT NULL DEFAULT '1111111';",
        kind: MigrationKind::Up,
    },
    Migration {
        version: 4,
        description: "create_time_reminders",
        sql: r#"
            CREATE TABLE IF NOT EXISTS time_reminders (
              task_id INTEGER NOT NULL,
              reminded_on TEXT NOT NULL,
              PRIMARY KEY (task_id, reminded_on)
            );
        "#,
        kind: MigrationKind::Up,
    },
    Migration {
        version: 5,
        description: "add_duration_days",
        sql: "ALTER TABLE tasks ADD COLUMN duration_days INTEGER;",
        kind: MigrationKind::Up,
    },
    Migration {
        version: 6,
        description: "add_remaining_days",
        sql: "ALTER TABLE tasks ADD COLUMN remaining_days INTEGER;",
        kind: MigrationKind::Up,
    },
    Migration {
        version: 7,
        description: "add_archive_reason",
        sql: "ALTER TABLE tasks ADD COLUMN archive_reason TEXT;",
        kind: MigrationKind::Up,
    },
    Migration {
        version: 8,
        description: "add_archived_at",
        sql: "ALTER TABLE tasks ADD COLUMN archived_at TEXT;",
        kind: MigrationKind::Up,
    },
    Migration {
        version: 9,
        description: "backfill_archive_reason",
        sql: "UPDATE tasks SET archive_reason = 'user', archived_at = updated_at WHERE archived = 1 AND archive_reason IS NULL;",
        kind: MigrationKind::Up,
    },
    Migration {
        version: 10,
        description: "add_last_reminded_at",
        sql: "ALTER TABLE time_reminders ADD COLUMN last_reminded_at TEXT;",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main_window(app);
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:cadence.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![raise_alert])
        .manage(ExitAllowed(AtomicBool::new(false)))
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                fit_to_work_area(&window);
            }

            let show_i =
                MenuItem::with_id(app, "show", "Hiện cửa sổ · Show", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Thoát · Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Cadence")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main_window(app),
                    "quit" => {
                        app.state::<ExitAllowed>()
                            .0
                            .store(true, Ordering::Relaxed);
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let allowed = window.state::<ExitAllowed>().0.load(Ordering::Relaxed);
                if !allowed {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                let allowed = app.state::<ExitAllowed>().0.load(Ordering::Relaxed);
                if !allowed {
                    api.prevent_exit();
                }
            }
        });
}
