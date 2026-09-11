import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { getSetting, setSetting } from "./db";
import { setLang, type Lang } from "./i18n";

export type Theme = "light" | "dark";

export type AppSettings = {
  autostart: boolean;
  showOnStartup: boolean;
  theme: Theme;
  language: Lang;
};

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export async function setTheme(theme: Theme): Promise<void> {
  applyTheme(theme);
  await setSetting("theme", theme);
}

export async function setLanguage(language: Lang): Promise<void> {
  setLang(language);
  await setSetting("language", language);
}

export async function loadSettings(): Promise<AppSettings> {
  const theme: Theme = (await getSetting("theme")) === "dark" ? "dark" : "light";
  applyTheme(theme);

  const language: Lang = (await getSetting("language")) === "en" ? "en" : "vi";
  setLang(language);

  const initialized = await getSetting("autostart_initialized");
  if (!initialized) {
    try {
      await enable();
    } catch {
      // Autostart can fail in some restricted environments; keep going.
    }
    await setSetting("autostart_initialized", "true");
    await setSetting("autostart", "true");
    await setSetting("show_on_startup", "true");
    return { autostart: true, showOnStartup: true, theme, language };
  }

  const storedAutostart = (await getSetting("autostart")) === "true";
  const showOnStartup = (await getSetting("show_on_startup")) !== "false";

  let autostart = storedAutostart;
  try {
    autostart = await isEnabled();
    // Cài đặt lại hoặc chuyển thư mục làm mục autostart cũ trỏ sai chỗ.
    if (storedAutostart && !autostart) {
      await enable();
      autostart = await isEnabled();
    }
    if (autostart !== storedAutostart) {
      await setSetting("autostart", autostart ? "true" : "false");
    }
  } catch {
    autostart = storedAutostart;
  }

  return { autostart, showOnStartup, theme, language };
}

export async function setAutostartEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await enable();
  } else {
    await disable();
  }
  await setSetting("autostart", enabled ? "true" : "false");
}

export async function setShowOnStartup(enabled: boolean): Promise<void> {
  await setSetting("show_on_startup", enabled ? "true" : "false");
}
