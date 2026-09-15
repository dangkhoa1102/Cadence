export type MainTab = "today" | "calendar" | "history" | "updates";

export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export type TourStep = {
  id: string;
  target: string | null;
  placement: TourPlacement;
  tab: MainTab;
  calendar?: "year" | "month" | "day";
  settings?: boolean;
  editor?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  { id: "welcome", target: null, tab: "today", placement: "center" },
  { id: "tabs", target: "tour-tabs", tab: "today", placement: "bottom" },
  { id: "today", target: "tour-progress", tab: "today", placement: "bottom" },
  { id: "tasks", target: "tour-tasks", tab: "today", placement: "bottom" },
  { id: "add", target: "tour-add", tab: "today", placement: "left" },
  { id: "editor", target: "tour-editor", tab: "today", placement: "right", editor: true },
  { id: "calendar", target: "tour-calendar", tab: "calendar", calendar: "year", placement: "bottom" },
  { id: "month", target: "tour-month-grid", tab: "calendar", calendar: "month", placement: "bottom" },
  { id: "day", target: "tour-day", tab: "calendar", calendar: "day", placement: "bottom" },
  { id: "history", target: "tour-history", tab: "history", placement: "bottom" },
  { id: "updates", target: "tour-updates", tab: "updates", placement: "bottom" },
  { id: "settings", target: "tour-settings", tab: "today", placement: "left", settings: true },
];
