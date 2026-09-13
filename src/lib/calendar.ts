import { weekdayIndex } from "./date";
import type { SpecialDay, Task } from "../types";

/** Ô ngày trong lưới lịch. `null` = ô đệm đầu/cuối tuần. */
export type CalendarCell = {
  date: string | null;
  day: number | null;
};

function iso(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/** Số ngày trong tháng (month: 1-12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Việc lặp có rơi vào ngày này không (theo bitmask weekdays). */
export function taskOccursOn(task: Task, isoDate: string): boolean {
  return task.weekdays[weekdayIndex(isoDate)] === "1";
}

/**
 * Lưới ngày cho một tháng, mở đầu bằng ô đệm để cột đầu là Thứ Hai
 * (khớp weekdayIndex: Monday = 0).
 */
export function monthGrid(year: number, month: number): CalendarCell[] {
  const total = daysInMonth(year, month);
  const leadingPad = weekdayIndex(iso(year, month, 1));
  const cells: CalendarCell[] = [];

  for (let i = 0; i < leadingPad; i += 1) {
    cells.push({ date: null, day: null });
  }
  for (let day = 1; day <= total; day += 1) {
    cells.push({ date: iso(year, month, day), day });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, day: null });
  }
  return cells;
}

export type MonthSummary = {
  /** Số việc khác nhau xuất hiện ít nhất một ngày trong tháng. */
  taskCount: number;
  /** Số ngày trong tháng có ít nhất một việc. */
  activeDays: number;
};

/** Tổng quan một tháng cho lưới 12 tháng. */
export function summarizeMonth(
  tasks: Task[],
  year: number,
  month: number,
): MonthSummary {
  const total = daysInMonth(year, month);
  const taskIds = new Set<number>();
  let activeDays = 0;

  for (let day = 1; day <= total; day += 1) {
    const date = iso(year, month, day);
    let hasAny = false;
    for (const task of tasks) {
      if (taskOccursOn(task, date)) {
        taskIds.add(task.id);
        hasAny = true;
      }
    }
    if (hasAny) activeDays += 1;
  }

  return { taskCount: taskIds.size, activeDays };
}

/** Các việc rơi vào một ngày cụ thể, giữ thứ tự ưu tiên của input. */
export function tasksOnDate(tasks: Task[], isoDate: string): Task[] {
  return tasks.filter((task) => taskOccursOn(task, isoDate));
}

/** Ngày đặc biệt rơi vào ngày này (khớp đúng ngày, hoặc khớp MM-DD nếu lặp năm). */
export function specialDayOn(
  specialDays: SpecialDay[],
  isoDate: string,
): SpecialDay | null {
  const monthDay = isoDate.slice(5); // "MM-DD"
  for (const day of specialDays) {
    if (day.yearly) {
      if (day.onDate.slice(5) === monthDay) return day;
    } else if (day.onDate === isoDate) {
      return day;
    }
  }
  return null;
}

/** Tháng này có ngày đặc biệt nào không. */
export function monthHasSpecialDay(
  specialDays: SpecialDay[],
  year: number,
  month: number,
): boolean {
  const mm = String(month).padStart(2, "0");
  return specialDays.some((day) => {
    if (day.yearly) return day.onDate.slice(5, 7) === mm;
    return day.onDate.slice(0, 7) === `${year}-${mm}`;
  });
}

/** Các việc xuất hiện ít nhất một ngày trong tháng, giữ thứ tự input. */
export function tasksInMonth(tasks: Task[], year: number, month: number): Task[] {
  const total = daysInMonth(year, month);
  return tasks.filter((task) => {
    for (let day = 1; day <= total; day += 1) {
      if (taskOccursOn(task, iso(year, month, day))) return true;
    }
    return false;
  });
}
