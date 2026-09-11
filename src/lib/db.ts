import Database from "@tauri-apps/plugin-sql";
import { nowIso, todayLocal, weekdayIndex } from "./date";
import { t } from "./i18n";
import {
  ALL_WEEKDAYS,
  type ArchiveReason,
  type CompleteResult,
  type Priority,
  type Task,
  type TaskDraft,
} from "../types";

type TaskRow = {
  id: number;
  title: string;
  notes: string;
  priority: number;
  due_time: string | null;
  weekdays: string;
  duration_days: number | null;
  remaining_days: number | null;
  sort_order: number;
  archived: number;
  archive_reason: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  completed: number;
  completion_count: number;
};

let dbPromise: Promise<Database> | null = null;

function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:cadence.db");
  }
  return dbPromise;
}

function normalizeTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length >= 4 ? trimmed.slice(0, 5) : null;
}

function normalizeDays(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  const days = Math.floor(value);
  return days > 0 ? days : null;
}

function toArchiveReason(value: string | null): ArchiveReason | null {
  return value === "completed" || value === "user" ? value : null;
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? "",
    priority: (row.priority as Priority) ?? 1,
    dueTime: normalizeTime(row.due_time),
    weekdays: row.weekdays || ALL_WEEKDAYS,
    durationDays: row.duration_days ?? null,
    remainingDays: row.remaining_days ?? null,
    sort_order: row.sort_order,
    archived: row.archived,
    archiveReason: toArchiveReason(row.archive_reason),
    archivedAt: row.archived_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed: row.completed === 1,
    completionCount: row.completion_count ?? 0,
  };
}

const TASK_FIELDS = `t.id, t.title, t.notes, t.priority, t.due_time, t.weekdays,
            t.duration_days, t.remaining_days, t.sort_order, t.archived,
            t.archive_reason, t.archived_at, t.created_at, t.updated_at,
            CASE WHEN c.id IS NULL THEN 0 ELSE 1 END AS completed,
            (SELECT COUNT(*) FROM completions WHERE task_id = t.id) AS completion_count`;

export async function listTodayTasks(date = todayLocal()): Promise<Task[]> {
  const db = await getDb();
  const dayPos = weekdayIndex(date) + 1;
  const rows = await db.select<TaskRow[]>(
    `SELECT ${TASK_FIELDS}
     FROM tasks t
     LEFT JOIN completions c ON c.task_id = t.id AND c.completed_on = $1
     WHERE t.archived = 0 AND substr(t.weekdays, $2, 1) = '1'
     ORDER BY t.priority DESC,
              CASE WHEN t.due_time IS NULL OR t.due_time = '' THEN 1 ELSE 0 END,
              t.due_time ASC,
              t.id ASC`,
    [date, dayPos],
  );
  return rows.map(toTask);
}

export async function listHistory(reason: ArchiveReason): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.select<TaskRow[]>(
    `SELECT t.id, t.title, t.notes, t.priority, t.due_time, t.weekdays,
            t.duration_days, t.remaining_days, t.sort_order, t.archived,
            t.archive_reason, t.archived_at, t.created_at, t.updated_at,
            0 AS completed,
            (SELECT COUNT(*) FROM completions WHERE task_id = t.id) AS completion_count
     FROM tasks t
     WHERE t.archived = 1 AND t.archive_reason = $1
     ORDER BY t.archived_at DESC, t.updated_at DESC, t.id DESC`,
    [reason],
  );
  return rows.map(toTask);
}

export async function getTaskById(id: number): Promise<Task | null> {
  const db = await getDb();
  const rows = await db.select<TaskRow[]>(
    `SELECT ${TASK_FIELDS}
     FROM tasks t
     LEFT JOIN completions c ON c.task_id = t.id AND c.completed_on = $1
     WHERE t.id = $2`,
    [todayLocal(), id],
  );
  return rows[0] ? toTask(rows[0]) : null;
}

export async function hasAnyActiveTasks(): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select<{ n: number }[]>(
    `SELECT COUNT(*) AS n FROM tasks WHERE archived = 0`,
  );
  return (rows[0]?.n ?? 0) > 0;
}

export async function createTask(draft: TaskDraft): Promise<void> {
  const db = await getDb();
  const stamp = nowIso();
  const duration = normalizeDays(draft.durationDays);
  await db.execute(
    `INSERT INTO tasks (
        title, notes, priority, due_time, weekdays, duration_days, remaining_days,
        sort_order, archived, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9)`,
    [
      draft.title.trim(),
      draft.notes.trim(),
      draft.priority,
      normalizeTime(draft.dueTime),
      draft.weekdays || ALL_WEEKDAYS,
      duration,
      duration,
      stamp,
      stamp,
    ],
  );
}

export async function updateTask(id: number, draft: TaskDraft): Promise<void> {
  const db = await getDb();
  const duration = normalizeDays(draft.durationDays);
  const current = await getTaskById(id);
  let remaining = current?.remainingDays ?? null;
  if (duration == null) {
    remaining = null;
  } else if (remaining == null) {
    remaining = duration;
  } else {
    remaining = Math.min(remaining, duration);
  }

  await db.execute(
    `UPDATE tasks
     SET title = $1, notes = $2, priority = $3, due_time = $4, weekdays = $5,
         duration_days = $6, remaining_days = $7, updated_at = $8
     WHERE id = $9`,
    [
      draft.title.trim(),
      draft.notes.trim(),
      draft.priority,
      normalizeTime(draft.dueTime),
      draft.weekdays || ALL_WEEKDAYS,
      duration,
      remaining,
      nowIso(),
      id,
    ],
  );
}

export async function archiveTask(
  id: number,
  reason: ArchiveReason = "user",
): Promise<void> {
  const db = await getDb();
  const stamp = nowIso();
  await db.execute(
    `UPDATE tasks
     SET archived = 1, archive_reason = $1, archived_at = $2, updated_at = $3
     WHERE id = $4`,
    [reason, stamp, stamp, id],
  );
}

export async function restoreTask(id: number): Promise<void> {
  const current = await getTaskById(id);
  const remaining =
    current?.archiveReason === "completed"
      ? (current.durationDays ?? 1)
      : current?.remainingDays ?? null;
  const db = await getDb();
  await db.execute(
    `UPDATE tasks
     SET archived = 0, archive_reason = NULL, archived_at = NULL,
         remaining_days = $1, updated_at = $2
     WHERE id = $3`,
    [remaining, nowIso(), id],
  );
}

export async function setTaskCompleted(
  taskId: number,
  completed: boolean,
  date = todayLocal(),
): Promise<CompleteResult> {
  const db = await getDb();
  const current = await getTaskById(taskId);
  const title = current?.title ?? t().taskFallback;
  const durationDays = current?.durationDays ?? null;
  let remainingDays = current?.remainingDays ?? null;

  if (completed) {
    const inserted = await db.execute(
      `INSERT OR IGNORE INTO completions (task_id, completed_on) VALUES ($1, $2)`,
      [taskId, date],
    );
    if ((inserted.rowsAffected ?? 0) > 0 && remainingDays != null) {
      remainingDays -= 1;
      if (remainingDays <= 0) {
        remainingDays = 0;
        await db.execute(
          `UPDATE tasks SET remaining_days = 0, updated_at = $1 WHERE id = $2`,
          [nowIso(), taskId],
        );
        await archiveTask(taskId, "completed");
        return { title, finished: true, remainingDays: 0, durationDays };
      }
      await db.execute(
        `UPDATE tasks SET remaining_days = $1, updated_at = $2 WHERE id = $3`,
        [remainingDays, nowIso(), taskId],
      );
    }
    return { title, finished: false, remainingDays, durationDays };
  }

  const removed = await db.execute(
    `DELETE FROM completions WHERE task_id = $1 AND completed_on = $2`,
    [taskId, date],
  );
  if (
    (removed.rowsAffected ?? 0) > 0 &&
    remainingDays != null &&
    current?.archived === 0
  ) {
    remainingDays += 1;
    if (durationDays != null) {
      remainingDays = Math.min(remainingDays, durationDays);
    }
    await db.execute(
      `UPDATE tasks SET remaining_days = $1, updated_at = $2 WHERE id = $3`,
      [remainingDays, nowIso(), taskId],
    );
  }
  return { title, finished: false, remainingDays, durationDays };
}

export async function listReminderTimes(date: string): Promise<Map<number, number>> {
  const db = await getDb();
  const rows = await db.select<{ task_id: number; last_reminded_at: string | null }[]>(
    `SELECT task_id, last_reminded_at FROM time_reminders WHERE reminded_on = $1`,
    [date],
  );
  const map = new Map<number, number>();
  for (const row of rows) {
    const parsed = row.last_reminded_at ? Date.parse(row.last_reminded_at) : Date.now();
    map.set(row.task_id, Number.isNaN(parsed) ? Date.now() : parsed);
  }
  return map;
}

export async function markTimeReminded(taskId: number, date: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO time_reminders (task_id, reminded_on, last_reminded_at)
     VALUES ($1, $2, $3)
     ON CONFLICT(task_id, reminded_on) DO UPDATE SET last_reminded_at = excluded.last_reminded_at`,
    [taskId, date, nowIso()],
  );
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    `SELECT value FROM settings WHERE key = $1`,
    [key],
  );
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}
