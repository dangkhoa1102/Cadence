import { invoke } from "@tauri-apps/api/core";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { listReminderTimes, markTimeReminded } from "./db";
import { isDueNow } from "./date";
import { t } from "./i18n";
import type { CompleteResult, Task } from "../types";

const WINDOWS_SOUND = "C:\\Windows\\Media\\Windows Notify Calendar.wav";
const REPEAT_MS = 5 * 60 * 1000;

let summaryNotifiedThisSession = false;

async function ensurePermission(): Promise<boolean> {
  let granted = await isPermissionGranted();
  if (!granted) {
    granted = (await requestPermission()) === "granted";
  }
  return granted;
}

export async function raiseAttention(): Promise<void> {
  await invoke("raise_alert");
}

export async function notifyEvent(
  title: string,
  body: string,
  attention = false,
): Promise<void> {
  if (await ensurePermission()) {
    sendNotification({ title, body, sound: WINDOWS_SOUND });
  }

  if (attention) {
    await raiseAttention();
  }
}

export async function remindIncomplete(remaining: number): Promise<void> {
  if (summaryNotifiedThisSession || remaining <= 0) {
    return;
  }

  summaryNotifiedThisSession = true;
  const s = t();
  await notifyEvent(
    s.notifyReminderTitle,
    remaining === 1 ? s.notifyRemindOne : s.notifyRemindMany(remaining),
    true,
  );
}

export async function remindDueTasks(tasks: Task[], date: string): Promise<void> {
  const due = tasks.filter((task) => !task.completed && isDueNow(task.dueTime));
  if (due.length === 0) {
    return;
  }

  const lastTimes = await listReminderTimes(date);
  const now = Date.now();
  const fresh = due.filter((task) => {
    const last = lastTimes.get(task.id);
    return last == null || now - last >= REPEAT_MS;
  });
  if (fresh.length === 0) {
    return;
  }

  const names = fresh.map((task) =>
    task.dueTime ? `${task.dueTime} · ${task.title}` : task.title,
  );
  const s = t();
  await notifyEvent(
    fresh.length === 1 ? s.notifyDueOne : s.notifyDueMany(fresh.length),
    names.join("\n"),
    true,
  );

  for (const task of fresh) {
    await markTimeReminded(task.id, date);
  }
}

export async function notifyCompleteResult(result: CompleteResult): Promise<void> {
  const s = t();

  if (result.finished) {
    await notifyEvent(
      s.notifyDeletedTitle,
      s.notifyFinishedBody(result.title, String(result.durationDays ?? "")),
    );
    return;
  }

  if (result.remainingDays == null) {
    return;
  }

  await notifyEvent(
    s.notifyRemainingTitle,
    s.notifyRemainingBody(result.title, result.remainingDays),
  );
}

export async function notifyUserDeleted(title: string): Promise<void> {
  const s = t();
  await notifyEvent(s.notifyDeletedTitle, s.notifyUserDeletedBody(title));
}

export async function notifyRestored(title: string): Promise<void> {
  const s = t();
  await notifyEvent(s.notifyRestoredTitle, s.notifyRestoredBody(title));
}
