import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getSetting, setSetting } from "./db";

export type UpdateInfo = {
  current: string;
  latest: string;
  notes: string;
  downloadUrl: string | null;
  hasUpdate: boolean;
};

export type UpdateProgress = {
  received: number;
  total: number | null;
};

export type UpdateGate =
  | { kind: "available"; info: UpdateInfo }
  | { kind: "downloading"; info: UpdateInfo; received: number; total: number | null }
  | { kind: "installing"; info: UpdateInfo }
  | { kind: "success"; current: string; latest: string }
  | { kind: "failed"; info: UpdateInfo; reason: string };

const SKIPPED_KEY = "update_skipped_version";
const PENDING_KEY = "update_pending_version";
const ERROR_KEY = "update_last_error";

export function normalizeVersion(raw: string): string {
  return raw.trim().replace(/^[vV]/, "");
}

export function versionCmp(left: string, right: string): number {
  const parse = (value: string): [number, number, number] => {
    const [major = "0", minor = "0", patch = "0"] = normalizeVersion(value).split(".");
    const num = (part: string) => Number.parseInt(part.replace(/\D.*$/, ""), 10) || 0;
    return [num(major), num(minor), num(patch)];
  };
  const a = parse(left);
  const b = parse(right);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

export function parseUpdateError(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : typeof err === "string" ? err : String(err ?? "");
  const [code, ...rest] = raw.split("|");
  const detail = rest.join("|").trim();
  return detail ? `${code}: ${detail}` : raw;
}

export async function checkForUpdate(): Promise<UpdateInfo> {
  return invoke<UpdateInfo>("check_for_update");
}

export async function startAppUpdate(url: string, version: string): Promise<void> {
  await invoke("start_app_update", { url, version });
}

export async function cancelAppUpdate(): Promise<void> {
  await invoke("cancel_app_update");
}

export async function listenUpdateProgress(
  onProgress: (progress: UpdateProgress) => void,
): Promise<UnlistenFn> {
  return listen<UpdateProgress>("update-progress", (event) => onProgress(event.payload));
}

export async function skipVersion(version: string): Promise<void> {
  await setSetting(SKIPPED_KEY, normalizeVersion(version));
  await setSetting(PENDING_KEY, "");
  await setSetting(ERROR_KEY, "");
}

export async function markUpdatePending(version: string): Promise<void> {
  await setSetting(PENDING_KEY, normalizeVersion(version));
  await setSetting(ERROR_KEY, "");
}

export async function markUpdateFailed(reason: string): Promise<void> {
  await setSetting(ERROR_KEY, reason);
}

export async function clearUpdateOutcome(): Promise<void> {
  await setSetting(PENDING_KEY, "");
  await setSetting(ERROR_KEY, "");
}

export async function resolveUpdateGate(): Promise<UpdateGate | null> {
  const current = await getVersion();
  const pending = normalizeVersion((await getSetting(PENDING_KEY)) ?? "");
  const lastError = (await getSetting(ERROR_KEY)) ?? "";
  const skipped = normalizeVersion((await getSetting(SKIPPED_KEY)) ?? "");

  if (pending) {
    if (versionCmp(current, pending) >= 0) {
      return { kind: "success", current, latest: pending };
    }

    let info: UpdateInfo = {
      current,
      latest: pending,
      notes: "",
      downloadUrl: null,
      hasUpdate: true,
    };
    try {
      const remote = await checkForUpdate();
      info = {
        ...remote,
        current,
        latest: pending,
        hasUpdate: true,
        downloadUrl: remote.downloadUrl,
      };
    } catch {
      // Retry vẫn hiện được; chỉ thiếu URL tải nếu GitHub không tới.
    }

    return {
      kind: "failed",
      info,
      reason: lastError || "not_applied|Cài đặt không áp dụng được.",
    };
  }

  try {
    const info = await checkForUpdate();
    if (info.hasUpdate && normalizeVersion(info.latest) !== skipped) {
      return { kind: "available", info };
    }
  } catch {
    // Không chặn app nếu GitHub tạm thời không tới được.
  }
  return null;
}
