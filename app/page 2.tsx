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
  { key: "done", title: "Done (Today)" },
];

const STORAGE_KEY = "workboard-daily-tasks";

const now = () => new Date().toLocaleString();

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
  readOnly,
}: {
  task: Task;
  onMove: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
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
        <span style={{ opacity: 0.7 }}> • {task.updatedAt}</span>
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
                <TaskCard key={t.id} task={t} onMove={moveTask} onDelete={deleteTask} />
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
