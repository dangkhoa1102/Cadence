import { t } from "./i18n";

export function todayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatLongDate(isoDate = todayLocal()): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(t().locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function nowHm(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/** Monday = 0 ... Sunday = 6 */
export function weekdayIndex(isoDate = todayLocal()): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  const jsDay = new Date(year, month - 1, day).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function isEveryDay(weekdays: string): boolean {
  return weekdays === "1111111";
}

export function formatWeekdays(weekdays: string): string | null {
  if (isEveryDay(weekdays)) {
    return null;
  }
  return t()
    .weekdays.filter((_, index) => weekdays[index] === "1")
    .join(" · ");
}

export function toggleWeekday(weekdays: string, index: number): string {
  const bits = weekdays.padEnd(7, "1").slice(0, 7).split("");
  bits[index] = bits[index] === "1" ? "0" : "1";
  const next = bits.join("");
  return next.includes("1") ? next : weekdays;
}

export function isDueNow(dueTime: string | null, now = nowHm()): boolean {
  return Boolean(dueTime && dueTime <= now);
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(t().locale);
}
