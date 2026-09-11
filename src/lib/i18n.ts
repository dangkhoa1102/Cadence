export type Lang = "vi" | "en";

const vi = {
  locale: "vi-VN",
  weekdays: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
  priority: { 2: "Cao", 1: "Trung bình", 0: "Thấp" },

  appName: "Nhắc việc",
  taskFallback: "Việc",
  navLabel: "Chuyển trang",
  tabToday: "Hôm nay",
  tabHistory: "Lịch sử",
  settings: "Cài đặt",
  close: "Đóng",
  detail: "Chi tiết",
  edit: "Sửa",
  delete: "Xóa",

  loadFailed: "Không mở được dữ liệu.",
  loading: "Đang tải danh sách...",
  addTask: "Thêm việc",
  dueBanner: "Đến giờ rồi",
  dueBannerBody: (names: string) => `${names} — tick xong thì hết nhắc.`,
  remainingToday: "còn lại hôm nay",
  progress: (done: number, total: number) => `${done}/${total} việc đã xong`,
  nothingToday: "Hôm nay không có việc nào",
  noTasksYet: "Chưa có việc nào",
  emptyTodayTitle: "Hôm nay trống",
  emptyTodayBody:
    "Các việc khác được hẹn vào ngày khác trong tuần. Sang ngày phù hợp, chúng sẽ hiện lại.",
  emptyAllTitle: "Việc theo ngày và giờ",
  emptyAllBody:
    "Thêm việc làm mỗi ngày hoặc trong một số ngày. Có thể gắn giờ và số ngày, hết ngày thì việc tự vào Lịch sử.",
  sectionOpen: "Cần làm",
  sectionDone: "Đã xong hôm nay",
  toggleAria: (title: string) => `Đánh dấu ${title}`,
  dueNowSuffix: " · Đã đến giờ",
  daysLeft: (remaining: number, total: number) => `Còn ${remaining}/${total} ngày`,

  savedNotice: (title: string) => `Đã lưu “${title}”.`,
  savedOtherDaysNotice: (title: string, days: string) =>
    `Đã lưu “${title}”, nhưng việc này chỉ hiện vào ${days} nên hôm nay không có trong danh sách.`,

  historyFilterLabel: "Lọc lịch sử",
  historyCompleted: "Đã hoàn thành",
  historyDeleted: "Đã xóa",
  historyCompletedHint: "Việc có số ngày và đã tick hết. Có thể xem chi tiết hoặc hoàn tác.",
  historyDeletedHint:
    "Việc bạn xóa tay. Có thể xem chi tiết hoặc hoàn tác để đưa lại danh sách.",
  historyEmptyCompletedTitle: "Chưa có việc hoàn thành",
  historyEmptyCompletedBody: "Khi việc có số ngày được tick hết, nó sẽ xuất hiện ở đây.",
  historyEmptyDeletedTitle: "Chưa xóa việc nào",
  historyEmptyDeletedBody: "Việc xóa từ danh sách hôm nay sẽ nằm ở tab này.",
  badgeFinished: "Hết ngày",
  badgeDeleted: "Xóa tay",
  daysCount: (days: number) => `${days} ngày`,
  completionsCount: (times: number) => `${times} lần hoàn thành`,
  restore: "Hoàn tác",

  editorCreateTitle: "Thêm việc",
  editorEditTitle: "Sửa việc",
  fieldName: "Tên việc",
  fieldNamePlaceholder: "Ví dụ: Uống thuốc sáng",
  fieldNotes: "Ghi chú",
  fieldNotesPlaceholder: "Tùy chọn",
  switchTime: "Giờ cụ thể",
  switchTimeHint: "Không bắt buộc. Bật thì app nhắc đúng giờ đó.",
  fieldTime: "Thời điểm trong ngày",
  switchDuration: "Số ngày",
  switchDurationHint: "Mỗi lần tick xong trừ 1. Về 0 thì việc tự xóa và vào Lịch sử.",
  fieldDuration: "Số ngày còn làm",
  legendWeekdays: "Ngày trong tuần",
  hintWeekdays: "Mặc định cả tuần. Bỏ chọn ngày nào thì việc không hiện ngày đó.",
  legendPriority: "Ưu tiên",
  cancel: "Hủy",
  save: "Lưu",

  detailTitle: "Chi tiết việc",
  detailName: "Tên",
  detailNotes: "Ghi chú",
  detailNoNotes: "Không có",
  detailPriority: "Ưu tiên",
  detailTime: "Giờ",
  detailNoTime: "Không đặt giờ",
  detailWeekdays: "Ngày trong tuần",
  detailEveryDay: "Cả tuần",
  detailDuration: "Số ngày",
  detailUnlimited: "Không giới hạn",
  detailDurationValue: (remaining: number, total: number) =>
    `${remaining}/${total} ngày còn lại`,
  detailCompletions: "Số lần hoàn thành",
  detailStatus: "Trạng thái",
  detailStatusFinished: "Hoàn thành hết số ngày, đã tự xóa",
  detailStatusDeleted: "Bạn đã xóa tay",
  detailStatusActive: "Đang dùng",
  detailCreatedAt: "Tạo lúc",
  detailArchivedAt: "Lưu lịch sử lúc",

  confirmDeleteTitle: "Xóa việc này?",
  confirmDeleteBody: (title: string) =>
    `“${title}” sẽ vào tab Lịch sử → Đã xóa. Bạn có thể hoàn tác sau.`,

  settingsAppearance: "Giao diện",
  settingsAppearanceHint: "Chọn tông màu sáng hoặc tối.",
  settingsLight: "Sáng",
  settingsDark: "Tối",
  settingsLanguage: "Ngôn ngữ",
  settingsLanguageHint: "Đổi ngôn ngữ hiển thị của app và thông báo.",
  settingsAutostart: "Mở cùng Windows",
  settingsAutostartHint: "App tự chạy khi bật máy. Có thể tắt bất cứ lúc nào.",
  settingsShowOnStartup: "Hiện cửa sổ khi khởi động",
  settingsShowOnStartupHint:
    "Nếu tắt, app chạy ở khay hệ thống cho đến khi bạn bấm icon.",
  settingsTrayHint:
    "Đóng cửa sổ sẽ ẩn app xuống khay hệ thống. Chọn “Thoát · Quit” trên icon khay để tắt hẳn. Windows sẽ báo khi đến giờ, còn ngày, hoặc việc bị xóa.",
  settingsDone: "Xong",

  notifyReminderTitle: "Nhắc việc",
  notifyRemindOne: "Còn 1 việc chưa làm hôm nay. Mở app để kiểm tra.",
  notifyRemindMany: (count: number) =>
    `Còn ${count} việc chưa làm hôm nay. Mở app để kiểm tra.`,
  notifyDueOne: "Đến giờ làm việc",
  notifyDueMany: (count: number) => `${count} việc đến giờ`,
  notifyDeletedTitle: "Đã xóa việc",
  notifyFinishedBody: (title: string, days: string) =>
    `“${title}” đã hoàn thành hết ${days} ngày và được đưa vào Lịch sử.`,
  notifyRemainingTitle: "Còn lại số ngày",
  notifyRemainingBody: (title: string, days: number) =>
    `“${title}” còn ${days} ngày.`,
  notifyUserDeletedBody: (title: string) =>
    `“${title}” đã được xóa. Có thể hoàn tác trong Lịch sử.`,
  notifyRestoredTitle: "Đã khôi phục",
  notifyRestoredBody: (title: string) => `“${title}” đã trở lại danh sách hôm nay.`,
};

export type Dict = typeof vi;

const en: Dict = {
  locale: "en-US",
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  priority: { 2: "High", 1: "Medium", 0: "Low" },

  appName: "Reminders",
  taskFallback: "Task",
  navLabel: "Switch page",
  tabToday: "Today",
  tabHistory: "History",
  settings: "Settings",
  close: "Close",
  detail: "Details",
  edit: "Edit",
  delete: "Delete",

  loadFailed: "Could not open your data.",
  loading: "Loading tasks...",
  addTask: "Add task",
  dueBanner: "It's time",
  dueBannerBody: (names: string) => `${names} — tick them off to stop the reminder.`,
  remainingToday: "left today",
  progress: (done: number, total: number) => `${done}/${total} tasks done`,
  nothingToday: "Nothing scheduled today",
  noTasksYet: "No tasks yet",
  emptyTodayTitle: "Today is clear",
  emptyTodayBody:
    "Your other tasks are scheduled for different weekdays. They will show up on those days.",
  emptyAllTitle: "Tasks by day and time",
  emptyAllBody:
    "Add tasks for every day or for a set number of days. You can attach a time and a day count; when the count hits zero the task moves to History.",
  sectionOpen: "To do",
  sectionDone: "Done today",
  toggleAria: (title: string) => `Mark ${title}`,
  dueNowSuffix: " · Due now",
  daysLeft: (remaining: number, total: number) => `${remaining}/${total} days left`,

  savedNotice: (title: string) => `Saved “${title}”.`,
  savedOtherDaysNotice: (title: string, days: string) =>
    `Saved “${title}”, but it only shows on ${days}, so it is not in today's list.`,

  historyFilterLabel: "Filter history",
  historyCompleted: "Completed",
  historyDeleted: "Deleted",
  historyCompletedHint:
    "Tasks with a day count that you ticked all the way down. You can view details or restore them.",
  historyDeletedHint:
    "Tasks you deleted yourself. You can view details or restore them to your list.",
  historyEmptyCompletedTitle: "No completed tasks yet",
  historyEmptyCompletedBody:
    "When a task with a day count reaches zero, it shows up here.",
  historyEmptyDeletedTitle: "Nothing deleted yet",
  historyEmptyDeletedBody: "Tasks you delete from today's list land in this tab.",
  badgeFinished: "Finished",
  badgeDeleted: "Deleted",
  daysCount: (days: number) => `${days} days`,
  completionsCount: (times: number) => `completed ${times} times`,
  restore: "Restore",

  editorCreateTitle: "Add task",
  editorEditTitle: "Edit task",
  fieldName: "Task name",
  fieldNamePlaceholder: "E.g. Morning medication",
  fieldNotes: "Notes",
  fieldNotesPlaceholder: "Optional",
  switchTime: "Specific time",
  switchTimeHint: "Optional. Turn it on and the app reminds you at that time.",
  fieldTime: "Time of day",
  switchDuration: "Day count",
  switchDurationHint:
    "Each completion takes one off. At zero the task deletes itself and moves to History.",
  fieldDuration: "Days to go",
  legendWeekdays: "Days of the week",
  hintWeekdays:
    "Every day by default. Unselect a day and the task will not show up on it.",
  legendPriority: "Priority",
  cancel: "Cancel",
  save: "Save",

  detailTitle: "Task details",
  detailName: "Name",
  detailNotes: "Notes",
  detailNoNotes: "None",
  detailPriority: "Priority",
  detailTime: "Time",
  detailNoTime: "No time set",
  detailWeekdays: "Days of the week",
  detailEveryDay: "Every day",
  detailDuration: "Day count",
  detailUnlimited: "Unlimited",
  detailDurationValue: (remaining: number, total: number) =>
    `${remaining}/${total} days left`,
  detailCompletions: "Times completed",
  detailStatus: "Status",
  detailStatusFinished: "Finished its day count and deleted itself",
  detailStatusDeleted: "You deleted it",
  detailStatusActive: "Active",
  detailCreatedAt: "Created",
  detailArchivedAt: "Moved to history",

  confirmDeleteTitle: "Delete this task?",
  confirmDeleteBody: (title: string) =>
    `“${title}” moves to History → Deleted. You can restore it later.`,

  settingsAppearance: "Appearance",
  settingsAppearanceHint: "Pick a light or dark tone.",
  settingsLight: "Light",
  settingsDark: "Dark",
  settingsLanguage: "Language",
  settingsLanguageHint: "Changes the language of the app and its notifications.",
  settingsAutostart: "Start with Windows",
  settingsAutostartHint: "The app runs when you turn the PC on. You can switch it off anytime.",
  settingsShowOnStartup: "Show the window on startup",
  settingsShowOnStartupHint:
    "When off, the app stays in the system tray until you click its icon.",
  settingsTrayHint:
    "Closing the window hides the app in the system tray. Choose “Thoát · Quit” on the tray icon to exit completely. Windows notifies you when a task is due, counts down, or gets deleted.",
  settingsDone: "Done",

  notifyReminderTitle: "Reminders",
  notifyRemindOne: "1 task is still open today. Open the app to check.",
  notifyRemindMany: (count: number) =>
    `${count} tasks are still open today. Open the app to check.`,
  notifyDueOne: "A task is due now",
  notifyDueMany: (count: number) => `${count} tasks are due now`,
  notifyDeletedTitle: "Task deleted",
  notifyFinishedBody: (title: string, days: string) =>
    `“${title}” finished all ${days} days and moved to History.`,
  notifyRemainingTitle: "Days remaining",
  notifyRemainingBody: (title: string, days: number) =>
    `“${title}” has ${days} days left.`,
  notifyUserDeletedBody: (title: string) =>
    `“${title}” was deleted. You can restore it from History.`,
  notifyRestoredTitle: "Restored",
  notifyRestoredBody: (title: string) => `“${title}” is back in today's list.`,
};

const dicts: Record<Lang, Dict> = { vi, en };

let current: Lang = "vi";

export function setLang(lang: Lang): void {
  current = lang;
  document.documentElement.lang = lang;
}

export function getLang(): Lang {
  return current;
}

/** Từ điển đang dùng. Component gọi trong lúc render để lấy chuỗi. */
export function t(): Dict {
  return dicts[current];
}
