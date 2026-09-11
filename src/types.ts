export type Priority = 0 | 1 | 2;
export type ArchiveReason = "completed" | "user";
export type HistoryFilter = ArchiveReason;

export type Task = {
  id: number;
  title: string;
  notes: string;
  priority: Priority;
  dueTime: string | null;
  weekdays: string;
  durationDays: number | null;
  remainingDays: number | null;
  sort_order: number;
  archived: number;
  archiveReason: ArchiveReason | null;
  archivedAt: string | null;
  created_at: string;
  updated_at: string;
  completed: boolean;
  completionCount: number;
};

export type TaskDraft = {
  title: string;
  notes: string;
  priority: Priority;
  dueTime: string | null;
  weekdays: string;
  durationDays: number | null;
};

export type CompleteResult = {
  title: string;
  finished: boolean;
  remainingDays: number | null;
  durationDays: number | null;
};

export const ALL_WEEKDAYS = "1111111";
