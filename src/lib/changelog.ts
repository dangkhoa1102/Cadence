import { getLang, type Lang } from "./i18n";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { normalizeVersion, versionCmp } from "./update";

export type VersionEntry = {
  version: string;
  name: string;
  notes: string;
  publishedAt: string | null;
  htmlUrl: string | null;
  isCurrent: boolean;
};

type LocalRelease = {
  version: string;
  date: string;
  name: Record<Lang, string>;
  notes: Record<Lang, string>;
};

const LOCAL: LocalRelease[] = [
  {
    version: "0.1.3",
    date: "2026-09-15",
    name: {
      vi: "Ghi chú phiên bản dễ đọc hơn",
      en: "Clearer version notes",
    },
    notes: {
      vi: `**Giao diện**
• Tiêu đề mục được đánh dấu bằng nhãn màu, không hiện ký tự markdown
• Ô chi tiết kéo dài xuống mép dưới cửa sổ (cách 20px), chỉ cuộn khi nội dung dài hơn chỗ trống`,
      en: `**Interface**
• Section titles use a colored label instead of markdown characters
• The notes panel fills down to 20px from the window edge and only scrolls when the text is longer`,
    },
  },
  {
    version: "0.1.2",
    date: "2026-09-15",
    name: { vi: "Hướng dẫn, phiên bản và cập nhật tại chỗ", en: "Guide, versions, and in-app update" },
    notes: {
      vi: `• Hướng dẫn sử dụng từng bước cho mọi trang và chức năng
• Tab Phiên bản: xem danh sách rồi bấm vào một bản để đọc chi tiết
• Thông báo khi có bản mới, cập nhật tại chỗ, bỏ qua hoặc xem lý do nếu thất bại
• Không còn crash khi database mới hơn bản đã cài (bỏ preload SQLite)`,
      en: `• Step-by-step walkthrough of every page and feature
• Versions tab: list releases, then open one for the full notes
• Prompt on launch when a newer build exists; update in place, skip, or see the failure reason
• No more silent crash when the database is ahead of the installed app`,
    },
  },
  {
    version: "0.1.1",
    date: "2026-09-15",
    name: { vi: "Sửa crash bản cũ gặp database mới", en: "Fix crash when an older app meets a newer database" },
    notes: {
      vi: `• Bản 0.1.0 mở từ shortcut desktop thoát ngay vì database đã có migration lịch (v11)
• Mở SQLite từ giao diện thay vì lúc khởi động Rust
• Thử lại nếu lần mở dữ liệu trước đó bị lỗi`,
      en: `• 0.1.0 launched from the desktop shortcut exited immediately once the calendar migration (v11) was in the database
• Load SQLite from the UI instead of during Rust startup
• Retry if a previous data load failed`,
    },
  },
  {
    version: "0.1.0",
    date: "2026-09-11",
    name: { vi: "Bản đầu tiên", en: "First release" },
    notes: {
      vi: `• Danh sách việc mỗi ngày, tự reset lúc 0h
• Ưu tiên, thứ trong tuần, giờ nhắc tùy chọn, số ngày đếm ngược
• Tab Lịch (năm / tháng / ngày), ngày đặc biệt
• Tab Lịch sử với hoàn tác
• Khay hệ thống, mở cùng Windows, thông báo + âm thanh 3 giây
• Tiếng Việt / English, sáng / tối`,
      en: `• Daily task list that resets at midnight
• Priorities, weekdays, optional time, countdown day counts
• Calendar tab (year / month / day) and special days
• History tab with restore
• System tray, start with Windows, notifications + 3 second sound
• Vietnamese / English, light / dark`,
    },
  },
];

function fromLocal(lang: Lang, current: string): VersionEntry[] {
  return LOCAL.map((item) => ({
    version: item.version,
    name: item.name[lang],
    notes: item.notes[lang],
    publishedAt: item.date,
    htmlUrl: null,
    isCurrent: versionCmp(item.version, current) === 0,
  }));
}

export async function loadVersionHistory(): Promise<VersionEntry[]> {
  const current = await getVersion();
  const lang = getLang();
  const map = new Map<string, VersionEntry>();

  for (const item of fromLocal(lang, current)) {
    map.set(item.version, item);
  }

  try {
    const remote = await invoke<
      {
        version: string;
        name: string;
        notes: string;
        publishedAt: string | null;
        htmlUrl: string | null;
        prerelease: boolean;
      }[]
    >("list_app_releases");
    for (const item of remote) {
      const version = normalizeVersion(item.version);
      const prev = map.get(version);
      map.set(version, {
        version,
        name: item.name || prev?.name || `Cadence ${version}`,
        notes: prev?.notes?.trim() ? prev.notes : item.notes.trim() || "",
        publishedAt: item.publishedAt ?? prev?.publishedAt ?? null,
        htmlUrl: item.htmlUrl,
        isCurrent: versionCmp(version, current) === 0,
      });
    }
  } catch {
    // Dùng changelog local khi GitHub không tới được.
  }

  if (![...map.values()].some((item) => item.isCurrent)) {
    map.set(normalizeVersion(current), {
      version: normalizeVersion(current),
      name: `Cadence ${current}`,
      notes: "",
      publishedAt: null,
      htmlUrl: null,
      isCurrent: true,
    });
  }

  return [...map.values()].sort((a, b) => versionCmp(b.version, a.version));
}

export type NoteBlock =
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "para"; text: string };

export function parseReleaseNotes(raw: string): NoteBlock[] {
  const blocks: NoteBlock[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push({ type: "list", items: list });
    list = [];
  };

  for (const line of raw.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    const headingMark = trimmed.match(/^#{1,3}\s+(.+)$/);
    const headingBold = trimmed.match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
    if (headingMark || headingBold) {
      flushList();
      const title = (headingMark?.[1] ?? headingBold?.[1] ?? "")
        .trim()
        .replace(/:+$/, "");
      const rest = headingBold?.[2]?.trim() ?? "";
      if (title) blocks.push({ type: "heading", text: title });
      if (rest) blocks.push({ type: "para", text: rest });
      continue;
    }

    const bullet = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      list.push(bullet[1]);
      continue;
    }

    flushList();
    blocks.push({ type: "para", text: trimmed });
  }

  flushList();
  return blocks;
}
