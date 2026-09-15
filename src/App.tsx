import { useEffect, useMemo, useRef, useState } from "react";
import type { ArchiveReason, Priority, Task, TaskDraft } from "./types";
import { ALL_WEEKDAYS } from "./types";
import {
  formatDateTime,
  formatLongDate,
  formatWeekdays,
  isDueNow,
  todayLocal,
  toggleWeekday,
  weekdayIndex,
} from "./lib/date";
import { t, type Lang } from "./lib/i18n";
import {
  addSpecialDay,
  archiveTask,
  createTask,
  deleteSpecialDay,
  getTaskById,
  hasAnyActiveTasks,
  listActiveTasks,
  listHistory,
  listSpecialDays,
  listTodayTasks,
  restoreTask,
  setTaskCompleted,
  updateTask,
} from "./lib/db";
import {
  monthGrid,
  monthHasSpecialDay,
  specialDayOn,
  summarizeMonth,
  tasksInMonth,
  tasksOnDate,
} from "./lib/calendar";
import type { SpecialDay, SpecialDayDraft } from "./types";
import {
  notifyCompleteResult,
  notifyRestored,
  notifyUserDeleted,
  remindDueTasks,
  remindIncomplete,
} from "./lib/notify";
import {
  loadSettings,
  setAutostartEnabled,
  setLanguage,
  setShowOnStartup,
  setTheme,
  type AppSettings,
  type Theme,
} from "./lib/settings";
import {
  cancelAppUpdate,
  clearUpdateOutcome,
  listenUpdateProgress,
  markUpdateFailed,
  markUpdatePending,
  resolveUpdateGate,
  skipVersion,
  startAppUpdate,
  type UpdateGate,
  type UpdateInfo,
} from "./lib/update";
import { TourOverlay } from "./TourOverlay";
import { loadVersionHistory, type VersionEntry } from "./lib/changelog";
import { TOUR_STEPS, type MainTab, type TourStep } from "./lib/tour";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return t().loadFailed;
}

const emptyDraft: TaskDraft = {
  title: "",
  notes: "",
  priority: 1,
  dueTime: null,
  weekdays: ALL_WEEKDAYS,
  durationDays: null,
};

export default function App() {
  const [date, setDate] = useState(todayLocal);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<Task[]>([]);
  const [tab, setTab] = useState<MainTab>("today");
  const [historyFilter, setHistoryFilter] = useState<ArchiveReason>("completed");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    task?: Task;
    presetDraft?: TaskDraft;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [hasOtherTasks, setHasOtherTasks] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [calendarTasks, setCalendarTasks] = useState<Task[]>([]);
  const now = new Date();
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number | null>(null);
  const [calendarDay, setCalendarDay] = useState<string | null>(null);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [specialEditorDate, setSpecialEditorDate] = useState<string | null>(null);
  const [updateGate, setUpdateGate] = useState<UpdateGate | null>(null);
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const [releases, setReleases] = useState<VersionEntry[]>([]);
  const [releasesError, setReleasesError] = useState<string | null>(null);
  const [releasesLoading, setReleasesLoading] = useState(false);
  const [releaseVersion, setReleaseVersion] = useState<string | null>(null);

  async function reloadToday(nextDate = todayLocal()) {
    setDate(nextDate);
    const rows = await listTodayTasks(nextDate);
    setTasks(rows);
    setHasOtherTasks(await hasAnyActiveTasks());
    return rows;
  }

  async function reloadHistory(reason = historyFilter) {
    const rows = await listHistory(reason);
    setHistory(rows);
    return rows;
  }

  async function reloadCalendar() {
    const [rows, specials] = await Promise.all([
      listActiveTasks(),
      listSpecialDays(),
    ]);
    setCalendarTasks(rows);
    setSpecialDays(specials);
    return rows;
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const [rows, loadedSettings] = await Promise.all([
          listTodayTasks(todayLocal()),
          loadSettings(),
        ]);
        if (cancelled) return;
        setTasks(rows);
        setSettings(loadedSettings);
        setDate(todayLocal());

        const window = getCurrentWindow();
        let updateUi: UpdateGate | null = null;
        try {
          updateUi = await resolveUpdateGate();
        } catch {
          updateUi = null;
        }
        if (cancelled) return;
        if (updateUi) {
          await window.show();
          await window.setFocus();
          setUpdateGate(updateUi);
        } else if (!loadedSettings.showOnStartup) {
          await window.hide();
        } else {
          await window.show();
          await window.setFocus();
        }

        setHasOtherTasks(await hasAnyActiveTasks());
      } catch (err) {
        if (!cancelled) {
          setError(describeError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Thông báo không được phép làm hỏng danh sách.
      try {
        const rows = await listTodayTasks(todayLocal());
        const dueNow = rows.some((task) => !task.completed && isDueNow(task.dueTime));
        if (dueNow) {
          await remindDueTasks(rows, todayLocal());
        } else {
          await remindIncomplete(rows.filter((task) => !task.completed).length);
        }
      } catch {
        // Bỏ qua: máy có thể đang tắt thông báo.
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const next = todayLocal();
          const rows = await reloadToday(next);
          await remindDueTasks(rows, next);
        } catch {
          // Lần kiểm tra sau sẽ thử lại.
        }
      })();
    }, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (tab === "history") {
      void reloadHistory(historyFilter);
    }
  }, [tab, historyFilter]);

  useEffect(() => {
    if (tab === "calendar") {
      void reloadCalendar().catch((err) => setError(describeError(err)));
    }
  }, [tab]);

  useEffect(() => {
    if (tab !== "updates") return;
    let cancelled = false;
    setReleasesLoading(true);
    void loadVersionHistory()
      .then((rows) => {
        if (cancelled) return;
        setReleases(rows);
        setReleasesError(null);
      })
      .catch((err) => {
        if (!cancelled) setReleasesError(describeError(err));
      })
      .finally(() => {
        if (!cancelled) setReleasesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, settings?.language]);

  useEffect(() => {
    if (tourIndex == null) return;
    const step: TourStep = TOUR_STEPS[tourIndex];
    setTab(step.tab);
    setSettingsOpen(Boolean(step.settings));
    if (step.editor) {
      setEditor({ mode: "create" });
    } else {
      setEditor(null);
    }
    if (step.tab === "calendar") {
      const stamp = new Date();
      if (step.calendar === "year") {
        setCalendarMonth(null);
        setCalendarDay(null);
      } else if (step.calendar === "month") {
        setCalendarYear(stamp.getFullYear());
        setCalendarMonth(stamp.getMonth() + 1);
        setCalendarDay(null);
      } else if (step.calendar === "day") {
        setCalendarYear(stamp.getFullYear());
        setCalendarMonth(stamp.getMonth() + 1);
        setCalendarDay(todayLocal());
      }
    }
    if (step.tab !== "updates") setReleaseVersion(null);
  }, [tourIndex]);

  const remaining = useMemo(
    () => tasks.filter((task) => !task.completed).length,
    [tasks],
  );
  const done = tasks.length - remaining;
  const openTasks = tasks.filter((task) => !task.completed);
  const doneTasks = tasks.filter((task) => task.completed);
  const overdueTasks = useMemo(
    () => tasks.filter((task) => !task.completed && isDueNow(task.dueTime)),
    [tasks],
  );

  async function onToggle(task: Task) {
    try {
      const result = await setTaskCompleted(task.id, !task.completed, date);
      await reloadToday(date);
      if (!task.completed) {
        await notifyCompleteResult(result);
      }
    } catch (err) {
      setError(describeError(err));
    }
  }

  async function onSave(draft: TaskDraft, taskId?: number) {
    const title = draft.title.trim();
    if (!title) return;

    try {
      if (taskId) {
        await updateTask(taskId, draft);
      } else {
        await createTask(draft);
      }
      setEditor(null);
      setError(null);
      await reloadToday(date);
      if (tab === "calendar") await reloadCalendar();

      const showsToday = draft.weekdays[weekdayIndex(date)] === "1";
      setNotice(
        showsToday
          ? t().savedNotice(title)
          : t().savedOtherDaysNotice(title, formatWeekdays(draft.weekdays) ?? ""),
      );
    } catch (err) {
      setError(describeError(err));
    }
  }

  async function onDelete(task: Task) {
    try {
      await archiveTask(task.id, "user");
      setPendingDelete(null);
      await reloadToday(date);
      if (tab === "calendar") await reloadCalendar();
      await notifyUserDeleted(task.title);
    } catch (err) {
      setError(describeError(err));
    }
  }

  async function onRestore(task: Task) {
    try {
      await restoreTask(task.id);
      await reloadHistory();
      await reloadToday(date);
      await notifyRestored(task.title);
    } catch (err) {
      setError(describeError(err));
    }
  }

  async function onShowDetail(task: Task) {
    const fresh = await getTaskById(task.id);
    setDetailTask(fresh ?? task);
  }

  async function onSaveSpecial(draft: SpecialDayDraft) {
    try {
      await addSpecialDay(draft);
      setSpecialEditorDate(null);
      await reloadCalendar();
    } catch (err) {
      setError(describeError(err));
    }
  }

  async function onRemoveSpecial(id: number) {
    try {
      await deleteSpecialDay(id);
      await reloadCalendar();
    } catch (err) {
      setError(describeError(err));
    }
  }

  async function onUpdateNow(info: UpdateInfo) {
    if (!info.downloadUrl) {
      const reason = "no_installer|Bản phát hành không có file cài đặt Windows.";
      await markUpdateFailed(reason);
      setUpdateGate({ kind: "failed", info, reason });
      return;
    }
    await markUpdatePending(info.latest);
    setUpdateGate({ kind: "downloading", info, received: 0, total: null });
    try {
      await startAppUpdate(info.downloadUrl, info.latest);
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      if (raw.startsWith("cancelled|")) {
        setUpdateGate({ kind: "available", info });
        return;
      }
      await markUpdateFailed(raw);
      setUpdateGate({ kind: "failed", info, reason: raw });
    }
  }

  async function onSkipUpdate(version: string) {
    await skipVersion(version);
    setUpdateGate(null);
  }

  async function onConfirmUpdateSuccess() {
    await clearUpdateOutcome();
    setUpdateGate(null);
  }

  async function onAutostartChange(enabled: boolean) {
    await setAutostartEnabled(enabled);
    setSettings((current) => (current ? { ...current, autostart: enabled } : current));
  }

  async function onShowOnStartupChange(enabled: boolean) {
    await setShowOnStartup(enabled);
    setSettings((current) =>
      current ? { ...current, showOnStartup: enabled } : current,
    );
  }

  async function onThemeChange(theme: Theme) {
    await setTheme(theme);
    setSettings((current) => (current ? { ...current, theme } : current));
  }

  async function onLanguageChange(language: Lang) {
    await setLanguage(language);
    setSettings((current) => (current ? { ...current, language } : current));
    setNotice(null);
  }

  const s = t();

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">{s.appName}</p>
          <h1>
            {tab === "today"
              ? formatLongDate(date)
              : tab === "calendar"
                ? calendarMonth == null
                  ? String(calendarYear)
                  : `${s.months[calendarMonth - 1]} ${calendarYear}`
                : tab === "updates"
                  ? releaseVersion
                    ? `Cadence ${releaseVersion}`
                    : s.tabUpdates
                  : s.tabHistory}
          </h1>
        </div>
        <div className="hero-tools">
          <nav className="tabs" aria-label={s.navLabel} data-tour="tour-tabs">
            <button
              type="button"
              className={tab === "today" ? "on" : ""}
              onClick={() => setTab("today")}
            >
              {s.tabToday}
            </button>
            <button
              type="button"
              className={tab === "calendar" ? "on" : ""}
              onClick={() => setTab("calendar")}
            >
              {s.tabCalendar}
            </button>
            <button
              type="button"
              className={tab === "history" ? "on" : ""}
              onClick={() => setTab("history")}
            >
              {s.tabHistory}
            </button>
            <button
              type="button"
              className={tab === "updates" ? "on" : ""}
              onClick={() => {
                setReleaseVersion(null);
                setTab("updates");
              }}
            >
              {s.tabUpdates}
            </button>
          </nav>
          <button
            className="icon-btn"
            type="button"
            aria-label={s.guide}
            onClick={() => setTourIndex(0)}
          >
            <HelpIcon />
          </button>
          <button
            className="icon-btn"
            type="button"
            aria-label={s.settings}
            onClick={() => setSettingsOpen(true)}
          >
            <GearIcon />
          </button>
        </div>
      </header>

      {notice && (
        <section className="notice-banner" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)}>
            {s.close}
          </button>
        </section>
      )}

      {tab === "today" && (
        <>
          {overdueTasks.length > 0 && (
            <section className="alert-banner" role="alert">
              <strong>{s.dueBanner}</strong>
              <span>
                {s.dueBannerBody(overdueTasks.map((task) => task.title).join(" · "))}
              </span>
            </section>
          )}
          <section className="progress-card" aria-live="polite" data-tour="tour-progress">
            <div>
              <strong>{remaining}</strong>
              <span>{s.remainingToday}</span>
            </div>
            <div className="meter" aria-hidden="true">
              <span
                style={{
                  width: tasks.length === 0 ? "0%" : `${(done / tasks.length) * 100}%`,
                }}
              />
            </div>
            <p>
              {tasks.length === 0
                ? hasOtherTasks
                  ? s.nothingToday
                  : s.noTasksYet
                : s.progress(done, tasks.length)}
            </p>
          </section>

          {error && <p className="banner error">{error}</p>}
          {loading && <p className="banner">{s.loading}</p>}

          {!loading && tasks.length === 0 && (
            <section className="empty" data-tour="tour-tasks">
              <h2>{hasOtherTasks ? s.emptyTodayTitle : s.emptyAllTitle}</h2>
              <p>{hasOtherTasks ? s.emptyTodayBody : s.emptyAllBody}</p>
            </section>
          )}

          {openTasks.length > 0 && (
            <section className="list" data-tour="tour-tasks">
              <h2>{s.sectionOpen}</h2>
              {openTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => void onToggle(task)}
                  onEdit={() => setEditor({ mode: "edit", task })}
                  onDelete={() => setPendingDelete(task)}
                  onDetail={() => void onShowDetail(task)}
                />
              ))}
            </section>
          )}

          {doneTasks.length > 0 && (
            <section className="list muted">
              <h2>{s.sectionDone}</h2>
              {doneTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => void onToggle(task)}
                  onEdit={() => setEditor({ mode: "edit", task })}
                  onDelete={() => setPendingDelete(task)}
                  onDetail={() => void onShowDetail(task)}
                />
              ))}
            </section>
          )}
        </>
      )}

      {tab === "calendar" && calendarMonth == null && (
        <CalendarYearView
          year={calendarYear}
          tasks={calendarTasks}
          specialDays={specialDays}
          onPrevYear={() => setCalendarYear((y) => y - 1)}
          onNextYear={() => setCalendarYear((y) => y + 1)}
          onSelectMonth={(month) => setCalendarMonth(month)}
        />
      )}

      {tab === "calendar" && calendarMonth != null && calendarDay == null && (
        <CalendarMonthView
          year={calendarYear}
          month={calendarMonth}
          tasks={calendarTasks}
          specialDays={specialDays}
          onBack={() => setCalendarMonth(null)}
          onSelectDay={(date) => setCalendarDay(date)}
          onEdit={(task) => setEditor({ mode: "edit", task })}
          onDelete={(task) => setPendingDelete(task)}
          onDetail={(task) => void onShowDetail(task)}
        />
      )}

      {tab === "calendar" && calendarDay != null && (
        <CalendarDayView
          date={calendarDay}
          tasks={tasksOnDate(calendarTasks, calendarDay)}
          special={specialDayOn(specialDays, calendarDay)}
          onBack={() => setCalendarDay(null)}
          onAddTask={() =>
            setEditor({
              mode: "create",
              presetDraft: {
                ...emptyDraft,
                weekdays: weekdayMask(weekdayIndex(calendarDay)),
              },
            })
          }
          onAddSpecial={() => setSpecialEditorDate(calendarDay)}
          onRemoveSpecial={(id) => void onRemoveSpecial(id)}
          onEdit={(task) => setEditor({ mode: "edit", task })}
          onDelete={(task) => setPendingDelete(task)}
          onDetail={(task) => void onShowDetail(task)}
        />
      )}

      {tab === "updates" && (
        <UpdatesView
          loading={releasesLoading}
          error={releasesError}
          releases={releases}
          selected={releaseVersion}
          onSelect={setReleaseVersion}
          onRetry={() => {
            setReleasesLoading(true);
            void loadVersionHistory()
              .then((rows) => {
                setReleases(rows);
                setReleasesError(null);
              })
              .catch((err) => setReleasesError(describeError(err)))
              .finally(() => setReleasesLoading(false));
          }}
        />
      )}

      {tab === "history" && (
        <section className="list">
          <nav className="tabs subtabs" aria-label={s.historyFilterLabel} data-tour="tour-history">
            <button
              type="button"
              className={historyFilter === "completed" ? "on" : ""}
              onClick={() => setHistoryFilter("completed")}
            >
              {s.historyCompleted}
            </button>
            <button
              type="button"
              className={historyFilter === "user" ? "on" : ""}
              onClick={() => setHistoryFilter("user")}
            >
              {s.historyDeleted}
            </button>
          </nav>
          <p className="banner">
            {historyFilter === "completed"
              ? s.historyCompletedHint
              : s.historyDeletedHint}
          </p>
          {history.length === 0 && (
            <section className="empty">
              <h2>
                {historyFilter === "completed"
                  ? s.historyEmptyCompletedTitle
                  : s.historyEmptyDeletedTitle}
              </h2>
              <p>
                {historyFilter === "completed"
                  ? s.historyEmptyCompletedBody
                  : s.historyEmptyDeletedBody}
              </p>
            </section>
          )}
          {history.map((task) => (
            <HistoryRow
              key={task.id}
              task={task}
              onDetail={() => void onShowDetail(task)}
              onRestore={() => void onRestore(task)}
            />
          ))}
        </section>
      )}

      {tab === "today" && (
        <button
          className="fab"
          type="button"
          data-tour="tour-add"
          onClick={() => setEditor({ mode: "create" })}
        >
          {s.addTask}
        </button>
      )}

      {editor && (
        <TaskEditor
          mode={editor.mode}
          task={editor.task}
          presetDraft={editor.presetDraft}
          onClose={() => setEditor(null)}
          onSave={(draft) => void onSave(draft, editor.task?.id)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={s.confirmDeleteTitle}
          body={s.confirmDeleteBody(pendingDelete.title)}
          confirmLabel={s.delete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void onDelete(pendingDelete)}
        />
      )}

      {detailTask && (
        <DetailDialog task={detailTask} onClose={() => setDetailTask(null)} />
      )}

      {specialEditorDate && (
        <SpecialDayEditor
          date={specialEditorDate}
          onClose={() => setSpecialEditorDate(null)}
          onSave={(draft) => void onSaveSpecial(draft)}
        />
      )}

      {settingsOpen && settings && (
        <SettingsDialog
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onAutostartChange={(value) => void onAutostartChange(value)}
          onShowOnStartupChange={(value) => void onShowOnStartupChange(value)}
          onThemeChange={(value) => void onThemeChange(value)}
          onLanguageChange={(value) => void onLanguageChange(value)}
        />
      )}

      {updateGate && (
        <UpdateDialog
          gate={updateGate}
          onProgress={(received, total) =>
            setUpdateGate((prev) =>
              prev?.kind === "downloading" ? { ...prev, received, total } : prev,
            )
          }
          onUpdate={(info) => void onUpdateNow(info)}
          onSkip={(version) => void onSkipUpdate(version)}
          onCancelDownload={() => void cancelAppUpdate()}
          onConfirmSuccess={() => void onConfirmUpdateSuccess()}
        />
      )}

      {tourIndex != null && TOUR_STEPS[tourIndex] && (
        <TourOverlay
          stepIndex={tourIndex}
          step={TOUR_STEPS[tourIndex]}
          onPrev={() => setTourIndex((i) => (i == null ? 0 : Math.max(0, i - 1)))}
          onNext={() => {
            if (tourIndex >= TOUR_STEPS.length - 1) {
              setTourIndex(null);
              setSettingsOpen(false);
              setEditor(null);
              return;
            }
            setTourIndex(tourIndex + 1);
          }}
          onSkip={() => {
            setTourIndex(null);
            setSettingsOpen(false);
            setEditor(null);
          }}
        />
      )}
    </main>
  );
}

function UpdatesView({
  loading,
  error,
  releases,
  selected,
  onSelect,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  releases: VersionEntry[];
  selected: string | null;
  onSelect: (version: string | null) => void;
  onRetry: () => void;
}) {
  const s = t();
  const detail = selected
    ? releases.find((item) => item.version === selected) ?? null
    : null;

  if (detail) {
    return (
      <section className="updates" data-tour="tour-updates">
        <div className="month-toolbar">
          <button type="button" className="back-btn" onClick={() => onSelect(null)}>
            ‹ {s.back}
          </button>
        </div>
        <article className="update-detail">
          <p className="eyebrow">{s.updatesDetailTitle}</p>
          <h2>
            {detail.name}
            {detail.isCurrent && <span className="update-badge">{s.updatesCurrent}</span>}
          </h2>
          {detail.publishedAt && (
            <p className="hint">{detail.publishedAt.slice(0, 10)}</p>
          )}
          <pre className="update-notes">{detail.notes.trim() || s.updatesNoNotes}</pre>
        </article>
      </section>
    );
  }

  return (
    <section className="updates" data-tour="tour-updates">
      {loading && <p className="banner">{s.loading}</p>}
      {error && (
        <p className="banner error">
          {error}{" "}
          <button type="button" className="ghost" onClick={onRetry}>
            {s.updatesRetry}
          </button>
        </p>
      )}
      {releases.length === 0 && !loading && (
        <section className="empty">
          <h2>{s.updatesEmptyTitle}</h2>
          <p>{s.updatesEmptyBody}</p>
          <button type="button" onClick={onRetry}>
            {s.updatesRetry}
          </button>
        </section>
      )}
      <div className="update-list">
        {releases.map((item) => (
          <button
            type="button"
            className="update-row"
            key={item.version}
            onClick={() => onSelect(item.version)}
          >
            <span>
              <strong>Cadence {item.version}</strong>
              <small>{item.name}</small>
            </span>
            {item.isCurrent && <span className="update-badge">{s.updatesCurrent}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

function CalendarYearView({
  year,
  tasks,
  specialDays,
  onPrevYear,
  onNextYear,
  onSelectMonth,
}: {
  year: number;
  tasks: Task[];
  specialDays: SpecialDay[];
  onPrevYear: () => void;
  onNextYear: () => void;
  onSelectMonth: (month: number) => void;
}) {
  const s = t();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (tasks.length === 0 && specialDays.length === 0) {
    return (
      <section className="calendar" data-tour="tour-calendar">
        <YearNav
          year={year}
          onPrevYear={onPrevYear}
          onNextYear={onNextYear}
        />
        <section className="empty">
          <h2>{s.calendarEmptyTitle}</h2>
          <p>{s.calendarEmptyBody}</p>
        </section>
      </section>
    );
  }

  return (
    <section className="calendar" data-tour="tour-calendar">
      <YearNav year={year} onPrevYear={onPrevYear} onNextYear={onNextYear} />
      {[0, 1, 2, 3].map((quarter) => (
        <div className="quarter" key={quarter}>
          <p className="quarter-label">{s.quarter(quarter + 1)}</p>
          <div className="month-grid">
            {[0, 1, 2].map((offset) => {
              const month = quarter * 3 + offset + 1;
              const summary = summarizeMonth(tasks, year, month);
              const isCurrent = year === currentYear && month === currentMonth;
              const hasSpecial = monthHasSpecialDay(specialDays, year, month);
              return (
                <button
                  type="button"
                  key={month}
                  className={`month-card ${isCurrent ? "current" : ""}`}
                  onClick={() => onSelectMonth(month)}
                >
                  <span className="month-name">
                    {s.months[month - 1]}
                    {hasSpecial && (
                      <span className="special-dot" aria-label={s.specialDay} />
                    )}
                  </span>
                  {summary.taskCount > 0 ? (
                    <span className="month-stats">
                      <strong>{s.monthTaskCount(summary.taskCount)}</strong>
                      <small>{s.monthActiveDays(summary.activeDays)}</small>
                    </span>
                  ) : (
                    <span className="month-stats muted">
                      <small>{s.monthNoTasks}</small>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function YearNav({
  year,
  onPrevYear,
  onNextYear,
}: {
  year: number;
  onPrevYear: () => void;
  onNextYear: () => void;
}) {
  const s = t();
  return (
    <div className="year-nav">
      <button type="button" aria-label={s.prevYear} onClick={onPrevYear}>
        ‹
      </button>
      <strong>{year}</strong>
      <button type="button" aria-label={s.nextYear} onClick={onNextYear}>
        ›
      </button>
    </div>
  );
}

function CalendarMonthView({
  year,
  month,
  tasks,
  specialDays,
  onBack,
  onSelectDay,
  onEdit,
  onDelete,
  onDetail,
}: {
  year: number;
  month: number;
  tasks: Task[];
  specialDays: SpecialDay[];
  onBack: () => void;
  onSelectDay: (date: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDetail: (task: Task) => void;
}) {
  const s = t();
  const cells = monthGrid(year, month);
  const monthTasks = tasksInMonth(tasks, year, month);
  const todayIso = todayLocal();

  return (
    <section className="calendar month-view">
      <div className="month-toolbar">
        <button type="button" className="back-btn" onClick={onBack}>
          ‹ {s.back}
        </button>
      </div>

      <div className="day-grid" data-tour="tour-month-grid">
        {s.weekdays.map((label) => (
          <div className="day-head" key={label}>
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (cell.date == null) {
            return <div className="day-cell empty" key={`pad-${index}`} />;
          }
          const cellDate = cell.date;
          const dayTasks = tasksOnDate(tasks, cellDate);
          const isToday = cellDate === todayIso;
          const special = specialDayOn(specialDays, cellDate);
          const shown = dayTasks.slice(0, 3);
          const extra = dayTasks.length - shown.length;
          return (
            <button
              type="button"
              className={`day-cell ${isToday ? "today" : ""} ${special ? "special" : ""}`}
              key={cellDate}
              onClick={() => onSelectDay(cellDate)}
            >
              <span className="day-num">{cell.day}</span>
              {special && <span className="special-chip">{special.title}</span>}
              <div className="day-tasks">
                {shown.map((task) => (
                  <span
                    className={`day-task priority-${task.priority}`}
                    key={task.id}
                    title={task.title}
                  >
                    {task.title}
                  </span>
                ))}
                {extra > 0 && <span className="day-more">{s.moreTasks(extra)}</span>}
              </div>
            </button>
          );
        })}
      </div>

      <section className="list month-list">
        <h2>{s.monthListTitle}</h2>
        {monthTasks.length === 0 ? (
          <section className="empty">
            <h2>{s.monthEmptyTitle}</h2>
            <p>{s.monthEmptyBody}</p>
          </section>
        ) : (
          monthTasks.map((task) => (
            <CalendarTaskRow
              key={task.id}
              task={task}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
              onDetail={() => onDetail(task)}
            />
          ))
        )}
      </section>
    </section>
  );
}

/** Chuỗi bitmask 7 ký tự chỉ bật đúng 1 ngày trong tuần (Mon=0..Sun=6). */
function weekdayMask(index: number): string {
  return Array.from({ length: 7 }, (_, i) => (i === index ? "1" : "0")).join("");
}

function CalendarDayView({
  date,
  tasks,
  special,
  onBack,
  onAddTask,
  onAddSpecial,
  onRemoveSpecial,
  onEdit,
  onDelete,
  onDetail,
}: {
  date: string;
  tasks: Task[];
  special: SpecialDay | null;
  onBack: () => void;
  onAddTask: () => void;
  onAddSpecial: () => void;
  onRemoveSpecial: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDetail: (task: Task) => void;
}) {
  const s = t();
  // Sắp theo giờ để xem lịch trình trong ngày: việc có giờ lên trước, theo giờ tăng dần.
  const ordered = [...tasks].sort((a, b) => {
    if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
    if (a.dueTime) return -1;
    if (b.dueTime) return 1;
    return b.priority - a.priority;
  });

  return (
    <section className="calendar day-view" data-tour="tour-day">
      <div className="month-toolbar">
        <button type="button" className="back-btn" onClick={onBack}>
          ‹ {s.back}
        </button>
        {special ? (
          <button
            type="button"
            className="special-toggle on"
            onClick={() => onRemoveSpecial(special.id)}
          >
            {s.removeSpecial}
          </button>
        ) : (
          <button type="button" className="special-toggle" onClick={onAddSpecial}>
            {s.markSpecial}
          </button>
        )}
      </div>

      <h2 className="day-title">{formatLongDate(date)}</h2>

      {special && (
        <div className="special-banner">
          <span className="special-dot" aria-hidden="true" />
          <strong>{special.title}</strong>
        </div>
      )}

      <div className="day-actions">
        <button type="button" className="add-day-task" onClick={onAddTask}>
          + {s.addTaskThisDay}
        </button>
      </div>

      <section className="list">
        {ordered.length === 0 ? (
          <section className="empty">
            <h2>{s.dayEmptyTitle}</h2>
            <p>{s.dayEmptyBody}</p>
          </section>
        ) : (
          ordered.map((task) => (
            <CalendarTaskRow
              key={task.id}
              task={task}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
              onDetail={() => onDetail(task)}
            />
          ))
        )}
      </section>
    </section>
  );
}

function SpecialDayEditor({
  date,
  onClose,
  onSave,
}: {
  date: string;
  onClose: () => void;
  onSave: (draft: SpecialDayDraft) => void;
}) {
  const s = t();
  const [title, setTitle] = useState("");
  const [yearly, setYearly] = useState(true);

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <form
        className="sheet"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onSave({ title: title.trim(), onDate: date, yearly });
        }}
      >
        <h2>{s.specialEditorTitle}</h2>
        <p>{formatLongDate(date)}</p>
        <label>
          {s.specialNameLabel}
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={s.specialNamePlaceholder}
            required
          />
        </label>
        <label className="switch-row">
          <span>
            <strong>{s.specialYearly}</strong>
            <small>{s.specialYearlyHint}</small>
          </span>
          <input
            type="checkbox"
            checked={yearly}
            onChange={(event) => setYearly(event.target.checked)}
          />
        </label>
        <div className="sheet-actions">
          <button type="button" className="ghost" onClick={onClose}>
            {s.cancel}
          </button>
          <button type="submit">{s.save}</button>
        </div>
      </form>
    </div>
  );
}

function CalendarTaskRow({
  task,
  onEdit,
  onDelete,
  onDetail,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onDetail: () => void;
}) {
  const s = t();
  const weekdayLabel = formatWeekdays(task.weekdays);

  return (
    <article className={`task priority-${task.priority}`}>
      <div className="history-mark" aria-hidden="true" />
      <div className="task-body">
        <div className="task-title-row">
          <h3>{task.title}</h3>
          <span className="badge">{s.priority[task.priority]}</span>
        </div>
        {(task.dueTime || weekdayLabel || task.remainingDays != null) && (
          <p className="meta">
            {task.dueTime && <span className="time">{task.dueTime}</span>}
            <span>{weekdayLabel ?? s.detailEveryDay}</span>
            {task.remainingDays != null && (
              <span>
                {s.daysLeft(
                  task.remainingDays,
                  task.durationDays ?? task.remainingDays,
                )}
              </span>
            )}
          </p>
        )}
        {task.notes && <p>{task.notes}</p>}
      </div>
      <div className="task-actions">
        <button type="button" onClick={onDetail}>
          {s.detail}
        </button>
        <button type="button" onClick={onEdit}>
          {s.edit}
        </button>
        <button type="button" className="danger" onClick={onDelete}>
          {s.delete}
        </button>
      </div>
    </article>
  );
}

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  onDetail,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDetail: () => void;
}) {
  const s = t();
  const weekdayLabel = formatWeekdays(task.weekdays);
  const overdue = Boolean(task.dueTime && isDueNow(task.dueTime) && !task.completed);

  return (
    <article className={`task priority-${task.priority} ${task.completed ? "done" : ""}`}>
      <label className="check">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={onToggle}
          aria-label={s.toggleAria(task.title)}
        />
        <span />
      </label>
      <div className="task-body">
        <div className="task-title-row">
          <h3>{task.title}</h3>
          <span className="badge">{s.priority[task.priority]}</span>
        </div>
        {(task.dueTime || weekdayLabel || task.remainingDays != null) && (
          <p className="meta">
            {task.dueTime && (
              <span className={overdue ? "overdue" : "time"}>
                {task.dueTime}
                {overdue ? s.dueNowSuffix : ""}
              </span>
            )}
            {weekdayLabel && <span>{weekdayLabel}</span>}
            {task.remainingDays != null && (
              <span>
                {s.daysLeft(
                  task.remainingDays,
                  task.durationDays ?? task.remainingDays,
                )}
              </span>
            )}
          </p>
        )}
        {task.notes && <p>{task.notes}</p>}
      </div>
      <div className="task-actions">
        <button type="button" onClick={onDetail}>
          {s.detail}
        </button>
        <button type="button" onClick={onEdit}>
          {s.edit}
        </button>
        <button type="button" className="danger" onClick={onDelete}>
          {s.delete}
        </button>
      </div>
    </article>
  );
}

function HistoryRow({
  task,
  onDetail,
  onRestore,
}: {
  task: Task;
  onDetail: () => void;
  onRestore: () => void;
}) {
  const s = t();

  return (
    <article className={`task priority-${task.priority}`}>
      <div className="history-mark" aria-hidden="true" />
      <div className="task-body">
        <div className="task-title-row">
          <h3>{task.title}</h3>
          <span className="badge">
            {task.archiveReason === "completed" ? s.badgeFinished : s.badgeDeleted}
          </span>
        </div>
        <p className="meta">
          <span>{formatDateTime(task.archivedAt)}</span>
          {task.durationDays != null && <span>{s.daysCount(task.durationDays)}</span>}
          <span>{s.completionsCount(task.completionCount)}</span>
        </p>
        {task.notes && <p>{task.notes}</p>}
      </div>
      <div className="task-actions">
        <button type="button" onClick={onDetail}>
          {s.detail}
        </button>
        <button type="button" onClick={onRestore}>
          {s.restore}
        </button>
      </div>
    </article>
  );
}

function TaskEditor({
  mode,
  task,
  presetDraft,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  task?: Task;
  presetDraft?: TaskDraft;
  onClose: () => void;
  onSave: (draft: TaskDraft) => void;
}) {
  const [draft, setDraft] = useState<TaskDraft>(
    task
      ? {
          title: task.title,
          notes: task.notes,
          priority: task.priority,
          dueTime: task.dueTime,
          weekdays: task.weekdays || ALL_WEEKDAYS,
          durationDays: task.durationDays,
        }
      : presetDraft ?? emptyDraft,
  );
  const s = t();
  const hasTime = Boolean(draft.dueTime);
  const hasDuration = draft.durationDays != null;

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <form
        className="sheet"
        data-tour="tour-editor"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
      >
        <h2>{mode === "create" ? s.editorCreateTitle : s.editorEditTitle}</h2>
        <label>
          {s.fieldName}
          <input
            autoFocus
            value={draft.title}
            onChange={(event) =>
              setDraft((current) => ({ ...current, title: event.target.value }))
            }
            placeholder={s.fieldNamePlaceholder}
            required
          />
        </label>
        <label>
          {s.fieldNotes}
          <textarea
            value={draft.notes}
            onChange={(event) =>
              setDraft((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder={s.fieldNotesPlaceholder}
            rows={3}
          />
        </label>
        <label className="switch-row">
          <span>
            <strong>{s.switchTime}</strong>
            <small>{s.switchTimeHint}</small>
          </span>
          <input
            type="checkbox"
            checked={hasTime}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                dueTime: event.target.checked ? current.dueTime || "08:00" : null,
              }))
            }
          />
        </label>
        {hasTime && (
          <label>
            {s.fieldTime}
            <input
              type="time"
              value={draft.dueTime ?? "08:00"}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  dueTime: event.target.value || null,
                }))
              }
            />
          </label>
        )}
        <label className="switch-row">
          <span>
            <strong>{s.switchDuration}</strong>
            <small>{s.switchDurationHint}</small>
          </span>
          <input
            type="checkbox"
            checked={hasDuration}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                durationDays: event.target.checked ? current.durationDays || 30 : null,
              }))
            }
          />
        </label>
        {hasDuration && (
          <label>
            {s.fieldDuration}
            <input
              type="number"
              min={1}
              max={3650}
              value={draft.durationDays ?? 30}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  durationDays: Number(event.target.value) || 1,
                }))
              }
            />
          </label>
        )}
        <fieldset>
          <legend>{s.legendWeekdays}</legend>
          <p className="hint field-hint">{s.hintWeekdays}</p>
          <div className="weekday-row">
            {s.weekdays.map((label, index) => {
              const on = draft.weekdays[index] === "1";
              return (
                <button
                  key={label}
                  type="button"
                  className={`weekday ${on ? "on" : ""}`}
                  aria-pressed={on}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      weekdays: toggleWeekday(current.weekdays, index),
                    }))
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend>{s.legendPriority}</legend>
          {([2, 1, 0] as Priority[]).map((priority) => (
            <label key={priority} className="choice">
              <input
                type="radio"
                name="priority"
                checked={draft.priority === priority}
                onChange={() => setDraft((current) => ({ ...current, priority }))}
              />
              {s.priority[priority]}
            </label>
          ))}
        </fieldset>
        <div className="sheet-actions">
          <button type="button" className="ghost" onClick={onClose}>
            {s.cancel}
          </button>
          <button type="submit">{s.save}</button>
        </div>
      </form>
    </div>
  );
}

function DetailDialog({ task, onClose }: { task: Task; onClose: () => void }) {
  const s = t();
  const weekdayLabel = formatWeekdays(task.weekdays);
  const reasonLabel =
    task.archiveReason === "completed"
      ? s.detailStatusFinished
      : task.archiveReason === "user"
        ? s.detailStatusDeleted
        : s.detailStatusActive;

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <section className="sheet" onClick={(event) => event.stopPropagation()}>
        <h2>{s.detailTitle}</h2>
        <dl className="details">
          <div>
            <dt>{s.detailName}</dt>
            <dd>{task.title}</dd>
          </div>
          <div>
            <dt>{s.detailNotes}</dt>
            <dd>{task.notes || s.detailNoNotes}</dd>
          </div>
          <div>
            <dt>{s.detailPriority}</dt>
            <dd>{s.priority[task.priority]}</dd>
          </div>
          <div>
            <dt>{s.detailTime}</dt>
            <dd>{task.dueTime || s.detailNoTime}</dd>
          </div>
          <div>
            <dt>{s.detailWeekdays}</dt>
            <dd>{weekdayLabel || s.detailEveryDay}</dd>
          </div>
          <div>
            <dt>{s.detailDuration}</dt>
            <dd>
              {task.durationDays == null
                ? s.detailUnlimited
                : s.detailDurationValue(task.remainingDays ?? 0, task.durationDays)}
            </dd>
          </div>
          <div>
            <dt>{s.detailCompletions}</dt>
            <dd>{task.completionCount}</dd>
          </div>
          <div>
            <dt>{s.detailStatus}</dt>
            <dd>{reasonLabel}</dd>
          </div>
          <div>
            <dt>{s.detailCreatedAt}</dt>
            <dd>{formatDateTime(task.created_at)}</dd>
          </div>
          {task.archivedAt && (
            <div>
              <dt>{s.detailArchivedAt}</dt>
              <dd>{formatDateTime(task.archivedAt)}</dd>
            </div>
          )}
        </dl>
        <div className="sheet-actions">
          <button type="button" onClick={onClose}>
            {s.close}
          </button>
        </div>
      </section>
    </div>
  );
}

function SettingsDialog({
  settings,
  onClose,
  onAutostartChange,
  onShowOnStartupChange,
  onThemeChange,
  onLanguageChange,
}: {
  settings: AppSettings;
  onClose: () => void;
  onAutostartChange: (enabled: boolean) => void;
  onShowOnStartupChange: (enabled: boolean) => void;
  onThemeChange: (theme: Theme) => void;
  onLanguageChange: (language: Lang) => void;
}) {
  const s = t();

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <section
        className="sheet"
        data-tour="tour-settings"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{s.settings}</h2>
        <fieldset>
          <legend>{s.settingsLanguage}</legend>
          <p className="field-hint">{s.settingsLanguageHint}</p>
          <div className="segmented">
            <button
              type="button"
              className={settings.language === "vi" ? "on" : ""}
              onClick={() => onLanguageChange("vi")}
            >
              Tiếng Việt
            </button>
            <button
              type="button"
              className={settings.language === "en" ? "on" : ""}
              onClick={() => onLanguageChange("en")}
            >
              English
            </button>
          </div>
        </fieldset>
        <fieldset>
          <legend>{s.settingsAppearance}</legend>
          <p className="field-hint">{s.settingsAppearanceHint}</p>
          <div className="segmented">
            <button
              type="button"
              className={settings.theme === "light" ? "on" : ""}
              onClick={() => onThemeChange("light")}
            >
              {s.settingsLight}
            </button>
            <button
              type="button"
              className={settings.theme === "dark" ? "on" : ""}
              onClick={() => onThemeChange("dark")}
            >
              {s.settingsDark}
            </button>
          </div>
        </fieldset>
        <label className="switch-row">
          <span>
            <strong>{s.settingsAutostart}</strong>
            <small>{s.settingsAutostartHint}</small>
          </span>
          <input
            type="checkbox"
            checked={settings.autostart}
            onChange={(event) => onAutostartChange(event.target.checked)}
          />
        </label>
        <label className="switch-row">
          <span>
            <strong>{s.settingsShowOnStartup}</strong>
            <small>{s.settingsShowOnStartupHint}</small>
          </span>
          <input
            type="checkbox"
            checked={settings.showOnStartup}
            onChange={(event) => onShowOnStartupChange(event.target.checked)}
          />
        </label>
        <p className="hint">{s.settingsTrayHint}</p>
        <div className="sheet-actions">
          <button type="button" onClick={onClose}>
            {s.settingsDone}
          </button>
        </div>
      </section>
    </div>
  );
}

function updateErrorText(reason: string): string {
  const s = t();
  const [code, ...rest] = reason.split("|");
  const detail = rest.join("|").trim();
  const mapped: Record<string, string> = {
    network: s.updateErrorNetwork,
    github: s.updateErrorGithub,
    no_installer: s.updateErrorNoInstaller,
    download: s.updateErrorDownload,
    spawn: s.updateErrorSpawn,
    not_applied: s.updateErrorNotApplied,
    cancelled: s.updateErrorCancelled,
    io: s.updateErrorIo,
  };
  const head = mapped[code] ?? s.updateErrorUnknown;
  return detail ? `${head}\n${detail}` : head;
}

function UpdateDialog({
  gate,
  onProgress,
  onUpdate,
  onSkip,
  onCancelDownload,
  onConfirmSuccess,
}: {
  gate: UpdateGate;
  onProgress: (received: number, total: number | null) => void;
  onUpdate: (info: UpdateInfo) => void;
  onSkip: (version: string) => void;
  onCancelDownload: () => void;
  onConfirmSuccess: () => void;
}) {
  const s = t();
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (gate.kind !== "downloading") return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    void listenUpdateProgress((progress) => {
      if (!cancelled) onProgressRef.current(progress.received, progress.total);
    }).then((unlisten) => {
      if (cancelled) unlisten();
      else stop = unlisten;
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [gate.kind]);

  const info =
    gate.kind === "success"
      ? null
      : gate.info;
  const percent =
    gate.kind === "downloading" && gate.total && gate.total > 0
      ? Math.min(100, Math.round((gate.received / gate.total) * 100))
      : gate.kind === "downloading"
        ? null
        : 100;

  return (
    <div className="overlay update-overlay" role="dialog" aria-modal="true">
      <section className="sheet update-sheet">
        {gate.kind === "available" && info && (
          <>
            <h2>{s.updateTitle}</h2>
            <p>{s.updateBody(info.current, info.latest)}</p>
            <p className="hint">{s.updateSkipHint}</p>
            {info.notes.trim() && (
              <pre className="update-notes">
                <strong>{s.updateNotes}</strong>
                {"\n"}
                {info.notes.trim()}
              </pre>
            )}
            <div className="sheet-actions">
              <button type="button" className="ghost" onClick={() => onSkip(info.latest)}>
                {s.updateSkip}
              </button>
              <button type="button" onClick={() => onUpdate(info)}>
                {s.updateNow}
              </button>
            </div>
          </>
        )}

        {gate.kind === "downloading" && info && (
          <>
            <h2>{s.updateDownloading}</h2>
            <p>{s.updateBody(info.current, info.latest)}</p>
            <div className="update-progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent ?? 0}>
              <span style={{ width: `${percent ?? 8}%` }} />
            </div>
            <p className="hint">
              {percent == null ? "…" : s.updatePercent(percent)}
            </p>
            <div className="sheet-actions">
              <button type="button" className="ghost" onClick={onCancelDownload}>
                {s.updateCancelDownload}
              </button>
            </div>
          </>
        )}

        {gate.kind === "installing" && info && (
          <>
            <h2>{s.updateInstalling}</h2>
            <p>{s.updateBody(info.current, info.latest)}</p>
          </>
        )}

        {gate.kind === "success" && (
          <>
            <h2>{s.updateSuccessTitle}</h2>
            <p>{s.updateSuccessBody(gate.latest)}</p>
            <div className="sheet-actions">
              <button type="button" onClick={onConfirmSuccess}>
                {s.updateSuccessConfirm}
              </button>
            </div>
          </>
        )}

        {gate.kind === "failed" && info && (
          <>
            <h2>{s.updateFailedTitle}</h2>
            <p>{s.updateFailedHint}</p>
            <pre className="update-error">{updateErrorText(gate.reason)}</pre>
            <div className="sheet-actions">
              <button type="button" className="ghost" onClick={() => onSkip(info.latest)}>
                {s.updateGiveUp}
              </button>
              <button type="button" onClick={() => onUpdate(info)}>
                {s.updateRetry}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="overlay" role="presentation" onClick={onCancel}>
      <section className="sheet" onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="sheet-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            {t().cancel}
          </button>
          <button type="button" className="danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function HelpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.6 9.4c.4-1.4 1.6-2.2 3-2.2 1.5 0 2.7.9 2.7 2.3 0 1.5-1.1 2-1.9 2.5-.8.5-1.1 1-1.1 1.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12.3" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 13a7.8 7.8 0 0 0 .1-2l2-1.5-2-3.5-2.4.5a7.7 7.7 0 0 0-1.7-1L13 3h-2l-.4 2.5a7.7 7.7 0 0 0-1.7 1L6.5 6 4.5 9.5 6.5 11a7.8 7.8 0 0 0 0 2l-2 1.5 2 3.5 2.4-.5a7.7 7.7 0 0 0 1.7 1L11 21h2l.4-2.5a7.7 7.7 0 0 0 1.7-1l2.4.5 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
