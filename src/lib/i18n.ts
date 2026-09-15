export type Lang = "vi" | "en";

const vi = {
  locale: "vi-VN",
  weekdays: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
  priority: { 2: "Cao", 1: "Trung bình", 0: "Thấp" },

  appName: "Nhắc việc",
  taskFallback: "Việc",
  navLabel: "Chuyển trang",
  tabToday: "Hôm nay",
  tabCalendar: "Lịch",
  tabHistory: "Lịch sử",
  tabUpdates: "Phiên bản",
  guide: "Hướng dẫn",
  settings: "Cài đặt",
  close: "Đóng",
  detail: "Chi tiết",
  edit: "Sửa",
  delete: "Xóa",

  months: [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ],
  quarter: (n: number) => `Quý ${n}`,
  prevYear: "Năm trước",
  nextYear: "Năm sau",
  back: "Quay lại",
  monthTaskCount: (count: number) => `${count} việc`,
  monthActiveDays: (days: number) => `${days} ngày có việc`,
  monthNoTasks: "Không có việc",
  calendarEmptyTitle: "Chưa có việc nào",
  calendarEmptyBody:
    "Thêm việc ở tab Hôm nay, rồi quay lại đây để xem chúng trải theo tháng.",
  monthEmptyTitle: "Tháng này chưa có việc",
  monthEmptyBody:
    "Các việc lặp theo ngày trong tuần sẽ hiện ở đây khi có việc khớp.",
  monthListTitle: "Việc trong tháng",
  moreTasks: (count: number) => `+${count}`,
  todayLabel: "Hôm nay",
  dayEmptyTitle: "Ngày này không có việc",
  dayEmptyBody: "Không có việc nào lặp vào ngày này.",
  addTaskThisDay: "Thêm việc vào ngày này",
  specialDay: "Ngày đặc biệt",
  markSpecial: "Đánh dấu ngày đặc biệt",
  removeSpecial: "Bỏ đánh dấu",
  specialEditorTitle: "Ngày đặc biệt",
  specialNameLabel: "Tên dịp",
  specialNamePlaceholder: "Ví dụ: Sinh nhật Mẹ",
  specialYearly: "Lặp lại hằng năm",
  specialYearlyHint: "Bật cho sinh nhật, kỷ niệm... lặp đúng ngày này mỗi năm.",

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

  updateTitle: "Có phiên bản mới",
  updateBody: (from: string, to: string) =>
    `Bạn đang dùng Cadence ${from}. Bản ${to} đã sẵn sàng.`,
  updateNotes: "Có gì mới",
  updateNow: "Cập nhật ngay",
  updateSkip: "Để sau, giữ bản hiện tại",
  updateSkipHint:
    "Bạn vẫn dùng được app như cũ. Chỉ không có chức năng mới của bản này.",
  updateDownloading: "Đang tải bản cập nhật…",
  updateInstalling: "Sắp cài đặt. Cadence sẽ đóng rồi tự mở lại.",
  updateCancelDownload: "Hủy tải",
  updateSuccessTitle: "Cập nhật thành công",
  updateSuccessBody: (version: string) => `Cadence đã lên phiên bản ${version}.`,
  updateSuccessConfirm: "Đã hiểu",
  updateFailedTitle: "Cập nhật chưa thành công",
  updateFailedHint: "Lý do:",
  updateRetry: "Thử lại",
  updateGiveUp: "Không cập nhật nữa",
  updatePercent: (pct: number) => `${pct}%`,
  updateErrorNetwork: "Không kết nối được máy chủ cập nhật (GitHub).",
  updateErrorGithub: "GitHub không trả về được bản phát hành.",
  updateErrorNoInstaller: "Bản phát hành không có file cài đặt Windows.",
  updateErrorDownload: "Tải file cài đặt thất bại.",
  updateErrorSpawn: "Không chạy được trình cài đặt.",
  updateErrorNotApplied:
    "Đã chạy cài đặt nhưng Cadence vẫn đang ở phiên bản cũ. File app có thể đang bị khóa.",
  updateErrorCancelled: "Đã hủy tải.",
  updateErrorIo: "Không ghi được file cập nhật lên máy.",
  updateErrorUnknown: "Lỗi không xác định.",

  tourSkip: "Bỏ qua",
  tourBack: "Trước",
  tourNext: "Tiếp",
  tourDone: "Xong",
  tourProgress: (step: number, total: number) => `${step}/${total}`,
  tourSteps: {
    welcome: {
      title: "Chào mừng đến Cadence",
      body: "Lần lượt từng bước: việc hôm nay, lịch, lịch sử, phiên bản và cài đặt. Bấm Tiếp để bắt đầu.",
    },
    tabs: {
      title: "Các trang chính",
      body: "Hôm nay là việc trong ngày. Lịch xem cả tháng/năm. Lịch sử giữ việc đã xong hoặc đã xóa. Phiên bản ghi chú từng bản cập nhật.",
    },
    today: {
      title: "Tiến độ hôm nay",
      body: "Số việc còn lại và thanh tiến độ. Tích xong thì số này giảm. Sang ngày mới, việc lặp sẽ hiện lại.",
    },
    tasks: {
      title: "Danh sách việc",
      body: "Tích ô tròn để đánh dấu xong. Chi tiết / Sửa / Xóa nằm bên phải mỗi việc.",
    },
    add: {
      title: "Thêm việc",
      body: "Nút góc dưới bên phải mở form tạo việc mới. Có thể đặt giờ, thứ trong tuần, số ngày và mức ưu tiên.",
    },
    editor: {
      title: "Form thêm / sửa",
      body: "Tên là bắt buộc. Giờ và số ngày là tùy chọn. Bỏ chọn thứ nào thì việc không hiện ngày đó. Hủy để đóng, không lưu.",
    },
    calendar: {
      title: "Lịch theo năm",
      body: "Mỗi tháng hiện số việc lặp trong tháng. Chấm vàng là có ngày đặc biệt. Bấm một tháng để xem lưới ngày.",
    },
    month: {
      title: "Lịch theo tháng",
      body: "Bấm một ngày để xem việc đúng ngày đó, sắp theo giờ. Quay lại để về 12 tháng.",
    },
    day: {
      title: "Chi tiết một ngày",
      body: "Thêm việc ngay trong ngày này, hoặc đánh dấu ngày đặc biệt (sinh nhật, kỷ niệm) để ô ngày nhấp nháy.",
    },
    history: {
      title: "Lịch sử",
      body: "Đã hoàn thành: việc đếm ngày đã về 0. Đã xóa: việc bạn xóa tay. Cả hai đều có Chi tiết và Hoàn tác.",
    },
    updates: {
      title: "Phiên bản",
      body: "Danh sách các bản Cadence. Bấm một bản để đọc ghi chú đầy đủ. Bản đang dùng có nhãn Hiện tại.",
    },
    settings: {
      title: "Cài đặt",
      body: "Đổi tiếng Việt / English, sáng / tối, mở cùng Windows, và hiện cửa sổ lúc khởi động. Đóng cửa sổ chỉ ẩn xuống khay.",
    },
  },

  updatesEmptyTitle: "Chưa lấy được danh sách",
  updatesEmptyBody:
    "Cadence vẫn hiện các bản đã biết trên máy. Kiểm tra mạng rồi thử lại để lấy ghi chú từ GitHub.",
  updatesRetry: "Thử lại",
  updatesCurrent: "Hiện tại",
  updatesDetailTitle: "Chi tiết phiên bản",
  updatesNoNotes: "Chưa có ghi chú cho bản này.",

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
  tabCalendar: "Calendar",
  tabHistory: "History",
  tabUpdates: "Versions",
  guide: "Guide",
  settings: "Settings",
  close: "Close",
  detail: "Details",
  edit: "Edit",
  delete: "Delete",

  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  quarter: (n: number) => `Q${n}`,
  prevYear: "Previous year",
  nextYear: "Next year",
  back: "Back",
  monthTaskCount: (count: number) => (count === 1 ? "1 task" : `${count} tasks`),
  monthActiveDays: (days: number) => (days === 1 ? "1 active day" : `${days} active days`),
  monthNoTasks: "No tasks",
  calendarEmptyTitle: "No tasks yet",
  calendarEmptyBody:
    "Add tasks on the Today tab, then come back here to see them spread across the months.",
  monthEmptyTitle: "No tasks this month",
  monthEmptyBody:
    "Tasks that repeat on weekdays show up here whenever a day matches.",
  monthListTitle: "Tasks this month",
  moreTasks: (count: number) => `+${count}`,
  todayLabel: "Today",
  dayEmptyTitle: "No tasks on this day",
  dayEmptyBody: "Nothing repeats on this day.",
  addTaskThisDay: "Add a task on this day",
  specialDay: "Special day",
  markSpecial: "Mark as special day",
  removeSpecial: "Remove mark",
  specialEditorTitle: "Special day",
  specialNameLabel: "Occasion name",
  specialNamePlaceholder: "E.g. Mom's birthday",
  specialYearly: "Repeat every year",
  specialYearlyHint: "Turn on for birthdays, anniversaries... repeats on this date each year.",

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

  updateTitle: "A new version is available",
  updateBody: (from: string, to: string) =>
    `You are on Cadence ${from}. Version ${to} is ready.`,
  updateNotes: "What's new",
  updateNow: "Update now",
  updateSkip: "Skip, keep this version",
  updateSkipHint:
    "The app keeps working as it is. You just will not get the new features from this release.",
  updateDownloading: "Downloading the update…",
  updateInstalling: "About to install. Cadence will close and reopen.",
  updateCancelDownload: "Cancel download",
  updateSuccessTitle: "Update complete",
  updateSuccessBody: (version: string) => `Cadence is now version ${version}.`,
  updateSuccessConfirm: "Got it",
  updateFailedTitle: "Update did not finish",
  updateFailedHint: "Reason:",
  updateRetry: "Try again",
  updateGiveUp: "Don't update",
  updatePercent: (pct: number) => `${pct}%`,
  updateErrorNetwork: "Could not reach the update server (GitHub).",
  updateErrorGithub: "GitHub did not return a release.",
  updateErrorNoInstaller: "This release has no Windows installer file.",
  updateErrorDownload: "Could not download the installer.",
  updateErrorSpawn: "Could not start the installer.",
  updateErrorNotApplied:
    "The installer ran, but Cadence is still on the old version. The app file may have been locked.",
  updateErrorCancelled: "Download cancelled.",
  updateErrorIo: "Could not write the update file to disk.",
  updateErrorUnknown: "Unknown error.",

  tourSkip: "Skip",
  tourBack: "Back",
  tourNext: "Next",
  tourDone: "Done",
  tourProgress: (step: number, total: number) => `${step}/${total}`,
  tourSteps: {
    welcome: {
      title: "Welcome to Cadence",
      body: "A short walk through today, the calendar, history, versions, and settings. Press Next to begin.",
    },
    tabs: {
      title: "Main pages",
      body: "Today is the daily list. Calendar covers months and years. History keeps finished or deleted tasks. Versions holds release notes.",
    },
    today: {
      title: "Today's progress",
      body: "How many tasks are left, plus a progress bar. Checking a task off lowers the count. Repeating tasks come back the next day.",
    },
    tasks: {
      title: "The task list",
      body: "Tick the circle to mark a task done. Details / Edit / Delete sit on the right of each row.",
    },
    add: {
      title: "Add a task",
      body: "The button at the bottom right opens the create form. You can set a time, weekdays, a day count, and a priority.",
    },
    editor: {
      title: "Create / edit form",
      body: "A name is required. Time and day count are optional. Unselect a weekday and the task will not show on that day. Cancel closes without saving.",
    },
    calendar: {
      title: "Year calendar",
      body: "Each month shows how many repeating tasks land in it. A gold dot means a special day. Tap a month for the day grid.",
    },
    month: {
      title: "Month calendar",
      body: "Tap a day to see tasks for that date, sorted by time. Back returns to the 12 months.",
    },
    day: {
      title: "A single day",
      body: "Add a task for this day, or mark it as a special day (birthday, anniversary) so the cell pulses.",
    },
    history: {
      title: "History",
      body: "Completed: day-count tasks that reached zero. Deleted: tasks you removed. Both have Details and Restore.",
    },
    updates: {
      title: "Versions",
      body: "Every Cadence release. Tap one for the full notes. The build you are on is labelled Current.",
    },
    settings: {
      title: "Settings",
      body: "Switch Vietnamese / English, light / dark, start with Windows, and whether the window opens at boot. Closing the window only hides it in the tray.",
    },
  },

  updatesEmptyTitle: "Could not refresh the list",
  updatesEmptyBody:
    "Cadence still shows the releases it knows about on this PC. Check the network and retry to pull notes from GitHub.",
  updatesRetry: "Retry",
  updatesCurrent: "Current",
  updatesDetailTitle: "Release details",
  updatesNoNotes: "No notes for this release yet.",

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
