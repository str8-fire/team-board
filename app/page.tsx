"use client";

import React, { useMemo, useState, useEffect } from "react";
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

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

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
  return (
    <div className={`${styles.task} ${readOnly ? styles.taskReadOnly : ""}`}>
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

      {task.notes ? <div className={styles.taskNotes}>{task.notes}</div> : null}

      {!readOnly && (
        <div className={styles.taskActions}>
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

          <button
            onClick={() => {
              const nextTitle = window.prompt("Edit task title:", task.title);
              if (nextTitle === null) return;
              const cleanTitle = nextTitle.trim();
              if (!cleanTitle) return;

              const nextPerson = window.prompt("Edit assigned to:", task.person);
              if (nextPerson === null) return;
              const cleanPerson = nextPerson.trim();
              if (!cleanPerson) return;

              const nextNotes = window.prompt("Edit notes (optional):", task.notes || "");
              if (nextNotes === null) return;
              const cleanNotes = nextNotes.trim();

              onEdit(task.id, {
                title: cleanTitle,
                person: cleanPerson,
                notes: cleanNotes ? cleanNotes : undefined,
              });
            }}
            className={`${styles.taskButton}`}
            title="Edit task"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(task.id)}
            className={`${styles.taskButton} ${styles.deleteButton}`}
            title="Delete task"
          >
            Delete
          </button>
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

export default function Home() {
  const [state, setState] = useState<{ todayKey: string; dateLabel: string; dailyBoards: DailyBoard }>({
    todayKey: "",
    dateLabel: "",
    dailyBoards: {},
  });
  const [showHistorical, setShowHistorical] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const [title, setTitle] = useState("");
  const [person, setPerson] = useState("");
  const [notes, setNotes] = useState("");

  const { todayKey, dateLabel, dailyBoards } = state;

  const todayTasks = useMemo(() => {
    return dailyBoards[todayKey] || [];
  }, [dailyBoards, todayKey]);

  const grouped = useMemo(() => {
    const map: Record<Status, Task[]> = { doing: [], blocked: [], help: [], done: [] };
    for (const t of todayTasks) map[t.status].push(t);
    return map;
  }, [todayTasks]);

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
  }, []);

  useEffect(() => {
    if (hasMounted && todayKey) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dailyBoards));
    }
  }, [dailyBoards, hasMounted, todayKey]);

  function addTask() {
    const cleanTitle = title.trim();
    const cleanPerson = person.trim();
    if (!cleanTitle || !cleanPerson) return;

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
    setTitle("");
    setPerson("");
    setNotes("");
  }

  function moveTask(id: string, status: Status) {
    setState((prev) => ({
      ...prev,
      dailyBoards: {
        ...prev.dailyBoards,
        [todayKey]: (prev.dailyBoards[todayKey] || []).map((t) =>
          t.id === id ? { ...t, status, updatedAt: now() } : t
        ),
      },
    }));
  }

  function deleteTask(id: string) {
    setState((prev) => ({
      ...prev,
      dailyBoards: {
        ...prev.dailyBoards,
        [todayKey]: (prev.dailyBoards[todayKey] || []).filter((t) => t.id !== id),
      },
    }));
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

        <div className={styles.subtitle}>Shared view of current work, blockers, and help needed.</div>
      </div>

      {/* Date row */}
      <div className={styles.dateRow}>
        <button
          type="button"
          className={`${styles.archiveToggle} ${showHistorical ? styles.archiveToggleActive : ""}`}
          onClick={() => setShowHistorical(!showHistorical)}
        >
          {showHistorical ? "Hide" : "Show"} Historical Tasks ({historicalDates.length})
        </button>
        <span className={styles.dateLabel}>{dateLabel}</span>
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
              tasks={dailyBoards[dateKey]}
            />
          ))}
        </div>
      )}

      {/* Add task section (lower like your mock) */}
      <div className={styles.addSection}>
        <h2 className={styles.addTitle}>Add a Task:</h2>

        <div className={styles.addForm}>
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title (e.g., Update hoodie mockups)"
          />

          <input
            className={styles.input}
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder="Assigned to (e.g., Wizard)"
          />

          <div className={styles.addRow}>
            <input
              className={styles.input}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
            />
            <button className={styles.button} onClick={addTask}>
              Add
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
