"use client";

import React, { useMemo, useState } from "react";
import styles from "./page.module.css";

type Status = "doing" | "blocked" | "help" | "done";

type Task = {
  id: string;
  title: string;
  person: string;
  notes?: string;
  status: Status;
  updatedAt: string;
};

const COLUMNS: { key: Status; title: string }[] = [
  { key: "doing", title: "Doing" },
  { key: "blocked", title: "Blocked" },
  { key: "help", title: "Need Help" },
  { key: "done", title: "Done (Today)" },
];

const now = () => new Date().toLocaleString();
const todayLabel = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const initialTasks: Task[] = [
  { id: "1", title: "DNGR website edits", person: "Wizard", status: "doing", updatedAt: "" },
  { id: "2", title: "Approve packaging colors", person: "T", status: "blocked", updatedAt: "" },
  {
    id: "3",
    title: "Reply to customer emails",
    person: "CS",
    status: "help",
    updatedAt: "",
    notes: "Refund + address changes",
  },
];

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
}: {
  task: Task;
  onMove: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={styles.task}>
      <div className={styles.taskTitle}>{task.title}</div>

      <div className={styles.taskMeta}>
        <span style={{ fontWeight: 700 }}>{task.person}</span>
        <span style={{ opacity: 0.7 }}> • {task.updatedAt}</span>
      </div>

      {task.notes ? <div className={styles.taskNotes}>{task.notes}</div> : null}

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
    </div>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [dateLabel, setDateLabel] = useState("");

  const [title, setTitle] = useState("");
  const [person, setPerson] = useState("");
  const [notes, setNotes] = useState("");

  const grouped = useMemo(() => {
    const map: Record<Status, Task[]> = { doing: [], blocked: [], help: [], done: [] };
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

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
    };

    setTasks((prev) => [newTask, ...prev]);
    setTitle("");
    setPerson("");
    setNotes("");
  }

  function moveTask(id: string, status: Status) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status, updatedAt: now() } : t)));
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  React.useEffect(() => {
    setDateLabel(todayLabel());
    setTasks((prev) =>
      prev.map((t) => (t.updatedAt ? t : { ...t, updatedAt: now() })),
    );
  }, []);

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
        <button type="button" className={styles.archiveToggle}>
          Archived (clickable to show/ hide)
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
