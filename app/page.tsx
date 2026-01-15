"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import styles from "./page.module.css";

type Status = "doing" | "blocked" | "help" | "done";

type Task = {
  id: string;
  title: string;
  person: string;
  notes?: string;
  status: Status;
  updatedAt: string;
  date: string;
  continued?: boolean;
};

type DailyBoard = {
  [dateKey: string]: Task[];
};

const COLUMNS: { key: Status; title: string }[] = [
  { key: "doing", title: "Doing" },
  { key: "blocked", title: "Blocked" },
  { key: "help", title: "Need Help" },
  { key: "done", title: "Completed" },
];

const STORAGE_KEY = "workboard-daily-tasks";
const ACTIVITY_KEY = "workboard-last-activity";

const now = () => new Date().toLocaleString();

function generateSampleData(): DailyBoard {
  const today = new Date();
  const todayKey = getDateKey(today);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);
  
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoKey = getDateKey(twoDaysAgo);
  
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoKey = getDateKey(threeDaysAgo);

  const formatDate = (date: Date) => date.toLocaleString();

  return {
    [threeDaysAgoKey]: [
      {
        id: "sample-1",
        title: "Design new logo concepts",
        person: "Wizard",
        notes: "Need 3 variations",
        status: "done",
        updatedAt: formatDate(threeDaysAgo),
        date: threeDaysAgoKey,
        continued: false,
      },
      {
        id: "sample-2",
        title: "Review vendor contracts",
        person: "T",
        status: "blocked",
        updatedAt: formatDate(threeDaysAgo),
        date: threeDaysAgoKey,
        continued: false,
      },
    ],
    [twoDaysAgoKey]: [
      {
        id: "sample-2-carried-" + twoDaysAgoKey,
        title: "Review vendor contracts",
        person: "T",
        status: "blocked",
        updatedAt: formatDate(twoDaysAgo),
        date: twoDaysAgoKey,
        continued: true,
      },
      {
        id: "sample-3",
        title: "Update product descriptions",
        person: "CS",
        notes: "Focus on SEO keywords",
        status: "doing",
        updatedAt: formatDate(twoDaysAgo),
        date: twoDaysAgoKey,
        continued: false,
      },
      {
        id: "sample-4",
        title: "Send weekly newsletter",
        person: "Marketing",
        status: "done",
        updatedAt: formatDate(twoDaysAgo),
        date: twoDaysAgoKey,
        continued: false,
      },
    ],
    [yesterdayKey]: [
      {
        id: "sample-2-carried-" + yesterdayKey,
        title: "Review vendor contracts",
        person: "T",
        status: "help",
        updatedAt: formatDate(yesterday),
        date: yesterdayKey,
        continued: true,
      },
      {
        id: "sample-3-carried-" + yesterdayKey,
        title: "Update product descriptions",
        person: "CS",
        notes: "Focus on SEO keywords",
        status: "doing",
        updatedAt: formatDate(yesterday),
        date: yesterdayKey,
        continued: true,
      },
      {
        id: "sample-5",
        title: "Prepare Q1 report",
        person: "Finance",
        status: "done",
        updatedAt: formatDate(yesterday),
        date: yesterdayKey,
        continued: false,
      },
      {
        id: "sample-6",
        title: "Fix checkout bug",
        person: "Dev",
        notes: "Payment gateway timeout issue",
        status: "blocked",
        updatedAt: formatDate(yesterday),
        date: yesterdayKey,
        continued: false,
      },
    ],
    [todayKey]: [
      {
        id: "sample-2-carried-" + todayKey,
        title: "Review vendor contracts",
        person: "T",
        status: "help",
        updatedAt: formatDate(today),
        date: todayKey,
        continued: true,
      },
      {
        id: "sample-3-carried-" + todayKey,
        title: "Update product descriptions",
        person: "CS",
        notes: "Focus on SEO keywords",
        status: "doing",
        updatedAt: formatDate(today),
        date: todayKey,
        continued: true,
      },
      {
        id: "sample-6-carried-" + todayKey,
        title: "Fix checkout bug",
        person: "Dev",
        notes: "Payment gateway timeout issue",
        status: "doing",
        updatedAt: formatDate(today),
        date: todayKey,
        continued: true,
      },
      {
        id: "sample-7",
        title: "DNGR website edits",
        person: "Wizard",
        status: "doing",
        updatedAt: formatDate(today),
        date: todayKey,
        continued: false,
      },
      {
        id: "sample-8",
        title: "Approve packaging colors",
        person: "T",
        status: "blocked",
        updatedAt: formatDate(today),
        date: todayKey,
        continued: false,
      },
      {
        id: "sample-9",
        title: "Reply to customer emails",
        person: "CS",
        notes: "Refund + address changes",
        status: "help",
        updatedAt: formatDate(today),
        date: todayKey,
        continued: false,
      },
    ],
  };
}

const getDateKey = (date: Date = new Date()) => {
  return date.toISOString().split("T")[0];
};

const formatDateLabel = (dateKey: string) => {
  const date = new Date(dateKey + "T12:00:00");
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const todayLabel = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

type Activity = {
  message: string;
  at: string;
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const nowDate = new Date();
  const diffMs = nowDate.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
};

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.column}>
      <div className={styles.columnTitle}>{title}</div>
      <div className={styles.columnItems}>{children}</div>
    </section>
  );
}

function TaskCard({
  task,
  onMove,
  onDelete,
  onEdit,
  readOnly,
}: {
  task: Task;
  onMove: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: { title: string; person: string; notes?: string }) => void;
  readOnly?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [notesTruncated, setNotesTruncated] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPerson, setEditPerson] = useState(task.person);
  const [editNotes, setEditNotes] = useState(task.notes || "");
  const notesRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditTitle(task.title);
      setEditPerson(task.person);
      setEditNotes(task.notes || "");
    }
  }, [task, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setConfirmingDelete(false);
    }
  }, [isEditing]);

  useEffect(() => {
    const el = notesRef.current;
    if (!el) {
      setNotesTruncated(false);
      return;
    }

    const updateTruncation = () => {
      const isTruncated = el.scrollWidth > el.clientWidth + 1;
      setNotesTruncated(isTruncated);
    };

    updateTruncation();

    const observer = new ResizeObserver(updateTruncation);
    observer.observe(el);
    return () => observer.disconnect();
  }, [task.notes, notesExpanded, isEditing]);

  const canSave = editTitle.trim().length > 0 && editPerson.trim().length > 0;

  return (
    <div className={`${styles.task} ${readOnly ? styles.taskReadOnly : ""}`}>
      {isEditing ? (
        <div className={styles.editForm} aria-label="Edit task">
          <input
            className={styles.editInput}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Task title"
            aria-label="Task title"
          />

          <input
            className={styles.editInput}
            value={editPerson}
            onChange={(e) => setEditPerson(e.target.value)}
            placeholder="Assigned to"
            aria-label="Assigned to"
          />

          <textarea
            className={styles.editTextarea}
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Notes (optional)"
            aria-label="Notes"
            rows={2}
          />
        </div>
      ) : (
        <>
          <div className={styles.taskTitle}>
            {task.continued && <span className={styles.continuedTag}>(continued) </span>}
            {task.title}
          </div>

          <div className={styles.taskMeta}>
            <span style={{ fontWeight: 700 }}>{task.person}</span>
            <span style={{ opacity: 0.7 }} title={task.updatedAt}>
              {" "}
              • {formatRelativeTime(task.updatedAt)}
            </span>
          </div>

          {task.notes ? (
            <div className={styles.taskNotesWrap}>
              <div
                className={`${styles.taskNotes} ${notesExpanded ? styles.taskNotesExpanded : ""}`}
                ref={notesRef}
                onDoubleClick={() => {
                  if (!notesTruncated && !notesExpanded) return;
                  setNotesExpanded((prev) => !prev);
                }}
                role="button"
                tabIndex={0}
                aria-expanded={notesExpanded}
              >
                {task.notes}
              </div>
              {(notesTruncated || notesExpanded) && (
                <button
                  type="button"
                  className={styles.taskNotesToggle}
                  onClick={() => setNotesExpanded((prev) => !prev)}
                  aria-expanded={notesExpanded}
                >
                  {notesExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          ) : null}
        </>
      )}

      {!readOnly && (
        <div className={styles.taskActions}>
          {confirmingDelete ? (
            <>
              <button
                onClick={() => {
                  setConfirmingDelete(false);
                }}
                className={`${styles.taskButton} ${styles.taskButtonSecondary}`}
                title="Cancel delete"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  onDelete(task.id);
                  setConfirmingDelete(false);
                }}
                className={`${styles.taskButton} ${styles.taskButtonDanger}`}
                title="Confirm delete"
              >
                Confirm Delete
              </button>
            </>
          ) : isEditing ? (
            <>
              <button
                onClick={() => {
                  if (!canSave) return;
                  onEdit(task.id, {
                    title: editTitle.trim(),
                    person: editPerson.trim(),
                    notes: editNotes.trim() ? editNotes.trim() : undefined,
                  });
                  setIsEditing(false);
                }}
                className={`${styles.taskButton} ${styles.taskButtonPrimary}`}
                title="Save changes"
                disabled={!canSave}
              >
                Save
              </button>

              <button
                onClick={() => {
                  setIsEditing(false);
                }}
                className={`${styles.taskButton} ${styles.taskButtonSecondary}`}
                title="Cancel editing"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {(["doing", "blocked", "help", "done"] as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onMove(task.id, s)}
                  disabled={task.status === s}
                  className={`${styles.taskButton} ${task.status === s ? styles.taskButtonActive : ""}`}
                  title={`Move to ${s}`}
                >
                  {s === "doing" ? "Doing" : s === "blocked" ? "Blocked" : s === "help" ? "Need Help" : "Done"}
                  </button>
                ))}

              {task.status !== "done" && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`${styles.taskButton}`}
                  title="Edit task"
                >
                  Edit
                </button>
              )}
            </>
          )}

          {!isEditing && !confirmingDelete && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className={`${styles.taskButton} ${styles.deleteButton}`}
              title="Delete task"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function HistoricalDaySection({
  dateKey,
  tasks,
}: {
  dateKey: string;
  tasks: Task[];
}) {
  const grouped = useMemo(() => {
    const map: Record<Status, Task[]> = { doing: [], blocked: [], help: [], done: [] };
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

  return (
    <div className={styles.historicalDay}>
      <div className={styles.historicalDateLabel}>{formatDateLabel(dateKey)}</div>
      <div className={styles.historicalBoard}>
        {COLUMNS.map((col) => (
          <Column key={col.key} title={col.title}>
      {grouped[col.key].length === 0 ? (
        <div className={styles.columnEmpty}>No items</div>
      ) : (
        grouped[col.key].map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onMove={() => {}}
            onDelete={() => {}}
            onEdit={() => {}}
            readOnly={true}
          />
        ))
      )}
          </Column>
        ))}
      </div>
    </div>
  );
}

function getInitialState(): { todayKey: string; dateLabel: string; dailyBoards: DailyBoard } {
  if (typeof window === "undefined") {
    return { todayKey: "", dateLabel: "", dailyBoards: {} };
  }
  
  const currentDateKey = getDateKey();
  const label = todayLabel();
  
  const stored = localStorage.getItem(STORAGE_KEY);
  let boards: DailyBoard = {};

  if (stored) {
    try {
      boards = JSON.parse(stored);
    } catch {
      boards = {};
    }
  }
  
  const totalTasks = Object.values(boards).reduce((sum, tasks) => sum + tasks.length, 0);

  if (Object.keys(boards).length === 0 || totalTasks === 0) {
    boards = generateSampleData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
    return { todayKey: currentDateKey, dateLabel: label, dailyBoards: boards };
  }

  const existingTodayTasks = boards[currentDateKey] || [];
  const existingTodayTaskIds = new Set(existingTodayTasks.map(t => t.id));
  const carriedOverTasks: Task[] = [];

  for (const dateKey of Object.keys(boards)) {
    if (dateKey >= currentDateKey) continue;

    const dayTasks = boards[dateKey];
    for (const task of dayTasks) {
      if (task.status !== "done") {
        const carriedTaskId = `${task.id}-carried-${currentDateKey}`;
        if (!existingTodayTaskIds.has(carriedTaskId)) {
          const carriedTask: Task = {
            ...task,
            id: carriedTaskId,
            date: currentDateKey,
            continued: true,
            updatedAt: now(),
          };
          carriedOverTasks.push(carriedTask);
        }
      }
    }
  }

  if (carriedOverTasks.length > 0) {
    boards[currentDateKey] = [...carriedOverTasks, ...existingTodayTasks];
  } else if (!boards[currentDateKey]) {
    boards[currentDateKey] = [];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));

  return { todayKey: currentDateKey, dateLabel: label, dailyBoards: boards };
}

function getInitialActivity(): Activity | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(ACTIVITY_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as Activity;
  } catch {
    return null;
  }
}

export default function Home() {
  const [state, setState] = useState<{ todayKey: string; dateLabel: string; dailyBoards: DailyBoard }>({
    todayKey: "",
    dateLabel: "",
    dailyBoards: {},
  });
  const [showHistorical, setShowHistorical] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [filterPerson, setFilterPerson] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [person, setPerson] = useState("");
  const [notes, setNotes] = useState("");
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const personInputRef = useRef<HTMLInputElement | null>(null);
  const [lastActivity, setLastActivity] = useState<Activity | null>(null);

  const { todayKey, dateLabel, dailyBoards } = state;

  const todayTasks = useMemo(() => {
    return dailyBoards[todayKey] || [];
  }, [dailyBoards, todayKey]);

  const allPeople = useMemo(() => {
    const people = new Set<string>();
    Object.values(dailyBoards).forEach((tasks) => {
      tasks.forEach((task) => {
        if (task.person) people.add(task.person);
      });
    });
    return Array.from(people).sort((a, b) => a.localeCompare(b));
  }, [dailyBoards]);

  const filterTasks = (tasks: Task[]) => {
    if (filterPerson === "all") return tasks;
    return tasks.filter((task) => task.person === filterPerson);
  };

  const grouped = useMemo(() => {
    const map: Record<Status, Task[]> = { doing: [], blocked: [], help: [], done: [] };
    for (const t of filterTasks(todayTasks)) map[t.status].push(t);
    return map;
  }, [todayTasks, filterPerson]);

  const todaySummary = useMemo(() => {
    const allToday = dailyBoards[todayKey] || [];
    const total = allToday.length;
    const blocked = allToday.filter((t) => t.status === "blocked").length;
    const help = allToday.filter((t) => t.status === "help").length;
    const done = allToday.filter((t) => t.status === "done").length;
    const active = Math.max(total - done, 0);
    if (total === 0) {
      return "Today's focus: 0 tasks";
    }
    return `Today's focus: ${active} active · ${blocked} blocked · ${help} needs help · ${done} completed`;
  }, [dailyBoards, todayKey]);

  const historicalDates = useMemo(() => {
    return Object.keys(dailyBoards)
      .filter((key) => key !== todayKey)
      .sort((a, b) => b.localeCompare(a));
  }, [dailyBoards, todayKey]);

  useEffect(() => {
    const initialState = getInitialState();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(initialState);
    setHasMounted(true);
    setLastActivity(getInitialActivity());
  }, []);

  useEffect(() => {
    if (hasMounted && todayKey) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dailyBoards));
    }
  }, [dailyBoards, hasMounted, todayKey]);

  const setActivity = (message: string) => {
    const activity = { message, at: now() };
    setLastActivity(activity);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
  };

  function addTask() {
    const cleanTitle = title.trim();
    const cleanPerson = person.trim();
    if (!cleanTitle) {
      titleInputRef.current?.focus();
      return;
    }
    if (!cleanPerson) {
      personInputRef.current?.focus();
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      person: cleanPerson,
      notes: notes.trim() || undefined,
      status: "doing",
      updatedAt: now(),
      date: todayKey,
      continued: false,
    };

    setState((prev) => ({
      ...prev,
      dailyBoards: {
        ...prev.dailyBoards,
        [todayKey]: [newTask, ...(prev.dailyBoards[todayKey] || [])],
      },
    }));
    setActivity(`${cleanPerson} added "${cleanTitle}"`);
    setTitle("");
    setPerson("");
    setNotes("");
  }

  function moveTask(id: string, status: Status) {
    const task = (dailyBoards[todayKey] || []).find((t) => t.id === id);
    setState((prev) => ({
      ...prev,
      dailyBoards: {
        ...prev.dailyBoards,
        [todayKey]: (prev.dailyBoards[todayKey] || []).map((t) =>
          t.id === id ? { ...t, status, updatedAt: now() } : t
        ),
      },
    }));
    if (task && task.status !== status) {
      const statusLabel =
        status === "doing" ? "Doing" : status === "blocked" ? "Blocked" : status === "help" ? "Need Help" : "Completed";
      setActivity(`${task.person} moved "${task.title}" to ${statusLabel}`);
    }
  }

  function deleteTask(id: string) {
    const task = (dailyBoards[todayKey] || []).find((t) => t.id === id);
    setState((prev) => ({
      ...prev,
      dailyBoards: {
        ...prev.dailyBoards,
        [todayKey]: (prev.dailyBoards[todayKey] || []).filter((t) => t.id !== id),
      },
    }));
    if (task) {
      setActivity(`${task.person} deleted "${task.title}"`);
    }
  }

  function editTask(id: string, updates: { title: string; person: string; notes?: string }) {
    setState((prev) => ({
      ...prev,
      dailyBoards: {
        ...prev.dailyBoards,
        [todayKey]: (prev.dailyBoards[todayKey] || []).map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: now() } : t
        ),
      },
    }));
  }

  return (
    <main className={styles.page}>
      {/* Top header area */}
      <div className={styles.top}>
        <div>
          <h1 className={styles.title}>
            Work
            <br />
            Board
          </h1>
          <div className={styles.badge}>Internal</div>
        </div>

        <div>
          <div className={styles.subtitle}>Shared view of current work, blockers, and help needed.</div>
          <div className={styles.contextBar}>
            <div className={styles.contextPrimary}>{todaySummary}</div>
            <div className={styles.contextSecondary}>
              {lastActivity
                ? `Last update: ${lastActivity.message} · ${formatRelativeTime(lastActivity.at)}`
                : "Last update: No recent activity"}
            </div>
          </div>
        </div>
      </div>

      {/* Date row */}
      <div className={styles.dateRow}>
        <span className={styles.dateLabel}>{dateLabel}</span>
        <div className={styles.dateActions}>
          <div className={styles.filterWrap}>
            <button
              type="button"
              className={`${styles.filterButton} ${filterPerson !== "all" ? styles.filterButtonActive : ""}`}
              onClick={() => setFilterOpen((prev) => !prev)}
              aria-expanded={filterOpen}
              aria-haspopup="listbox"
            >
              <svg
                className={styles.filterIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M4 5h16l-6.5 7v5.5l-3 1.5V12L4 5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={styles.filterLabel}>
                {filterPerson === "all" ? "Filter" : filterPerson}
              </span>
            </button>
            {filterOpen && (
              <div className={styles.filterMenu} role="listbox">
                <button
                  type="button"
                  className={styles.filterOption}
                  onClick={() => {
                    setFilterPerson("all");
                    setFilterOpen(false);
                  }}
                >
                  All
                </button>
                {allPeople.map((personName) => (
                  <button
                    key={personName}
                    type="button"
                    className={styles.filterOption}
                    onClick={() => {
                      setFilterPerson(personName);
                      setFilterOpen(false);
                    }}
                  >
                    {personName}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className={`${styles.archiveToggle} ${showHistorical ? styles.archiveToggleActive : ""}`}
            onClick={() => setShowHistorical(!showHistorical)}
            aria-pressed={showHistorical}
          >
            <span className={styles.archiveLabel}>Show History</span>
            <span className={styles.archiveSwitch} aria-hidden="true">
              <span className={styles.archiveSwitchThumb} />
            </span>
          </button>
        </div>
      </div>

      {/* Board */}
      <div className={styles.board}>
        {COLUMNS.map((col) => (
          <Column key={col.key} title={col.title}>
            {grouped[col.key].length === 0 ? (
              <div className={styles.columnEmpty}>No items</div>
            ) : (
              grouped[col.key].map((t) => (
                <TaskCard key={t.id} task={t} onMove={moveTask} onDelete={deleteTask} onEdit={editTask} />
              ))
            )}
          </Column>
        ))}
      </div>

      {/* Historical tasks section */}
      {showHistorical && historicalDates.length > 0 && (
        <div className={styles.historicalSection}>
          <h2 className={styles.historicalTitle}>Historical Tasks</h2>
          {historicalDates.map((dateKey) => (
            <HistoricalDaySection
              key={dateKey}
              dateKey={dateKey}
              tasks={filterTasks(dailyBoards[dateKey])}
            />
          ))}
        </div>
      )}

      {/* Add task section (lower like your mock) */}
      <div className={styles.addSection} id="add-task">
        <h2 className={styles.addTitle}>Add a Task:</h2>

        <form
          className={styles.addForm}
          onSubmit={(e) => {
            e.preventDefault();
            addTask();
          }}
        >
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title (e.g., Update hoodie mockups)"
            ref={titleInputRef}
          />

          <input
            className={styles.input}
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder="Assigned to (e.g., Wizard)"
            ref={personInputRef}
          />

          <div className={styles.addRow}>
            <input
              className={styles.input}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
            />
            <button className={styles.button} type="submit">
              Add
            </button>
          </div>
        </form>
      </div>

      <button
        type="button"
        className={styles.fab}
        aria-label="Add new task"
        onClick={() => {
          const target = document.getElementById("add-task");
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          window.setTimeout(() => {
            titleInputRef.current?.focus();
          }, 250);
        }}
      >
        +
      </button>
    </main>
  );
}
