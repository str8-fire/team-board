"use client";

import React, { useMemo, useState, useRef, useCallback } from "react";
import styles from "./page.module.css";
import { useTasks } from "@/hooks/useTasks";
import { useActivity } from "@/hooks/useActivity";
import type { Task, Status, Priority } from "@/lib/database.types";

const COLUMNS: { key: Status; title: string }[] = [
  { key: "doing", title: "Doing" },
  { key: "blocked", title: "Blocked" },
  { key: "help", title: "Need Help" },
  { key: "done", title: "Completed" },
];

const PRIORITY_OPTIONS: { key: Priority; label: string }[] = [
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
  { key: "none", label: "None" },
];

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

type UITask = {
  id: string;
  title: string;
  person: string;
  notes?: string;
  status: Status;
  priority: Priority;
  sortOrder: number;
  updatedAt: string;
  date: string;
  continued?: boolean;
};

function toUITask(task: Task): UITask {
  return {
    id: task.id,
    title: task.title,
    person: task.person,
    notes: task.notes || undefined,
    status: task.status,
    priority: task.priority,
    sortOrder: task.sort_order,
    updatedAt: task.updated_at,
    date: task.date,
    continued: task.continued,
  };
}

function Column({
  title,
  children,
  onDragOver,
  onDrop,
}: {
  title: string;
  children: React.ReactNode;
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
}) {
  return (
    <section className={styles.column}>
      <div className={styles.columnTitle}>{title}</div>
      <div className={styles.columnItems} onDragOver={onDragOver} onDrop={onDrop}>
        {children}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  onMove,
  onDelete,
  onEdit,
  onPriorityChange,
  onDragStart,
  onDragEnd,
  isDragging,
  readOnly,
}: {
  task: UITask;
  onMove: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: { title: string; person: string; notes?: string }) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  readOnly?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [notesTruncated, setNotesTruncated] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPerson, setEditPerson] = useState(task.person);
  const [editNotes, setEditNotes] = useState(task.notes || "");
  const notesRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isEditing) {
      setEditTitle(task.title);
      setEditPerson(task.person);
      setEditNotes(task.notes || "");
    }
  }, [task, isEditing]);

  React.useEffect(() => {
    if (!isEditing) {
      setConfirmingDelete(false);
    }
  }, [isEditing]);

  React.useEffect(() => {
    if (isEditing) {
      setPriorityOpen(false);
    }
  }, [isEditing]);

  React.useEffect(() => {
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

  const priorityClass =
    task.priority === "high"
      ? styles.taskPriorityHigh
      : task.priority === "medium"
        ? styles.taskPriorityMedium
        : task.priority === "low"
          ? styles.taskPriorityLow
          : "";

  const priorityLabel =
    task.priority === "high"
      ? "High"
      : task.priority === "medium"
        ? "Medium"
        : task.priority === "low"
          ? "Low"
          : "None";

  return (
    <div
      className={`${styles.task} ${readOnly ? styles.taskReadOnly : ""} ${priorityClass} ${
        isDragging ? styles.taskDragging : ""
      }`}
      data-task-id={task.id}
      draggable={!readOnly}
      onDragStart={(event) => {
        if (readOnly) return;
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart(task.id);
      }}
      onDragEnd={() => {
        if (readOnly) return;
        onDragEnd();
      }}
    >
      {!readOnly && (
        <div className={styles.priorityWrap}>
          <button
            type="button"
            className={`${styles.priorityChip} ${styles[`priority${priorityLabel}`]}`}
            onClick={() => setPriorityOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={priorityOpen}
            title={`${priorityLabel} priority`}
          >
            <span className={styles.priorityFlag} aria-hidden="true">
              <svg viewBox="0 0 20 20" focusable="false">
                <path
                  d="M5 3v14M6 4h8l-2.2 3L14 10H6z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {priorityLabel}
          </button>
          {priorityOpen && (
            <div className={styles.priorityMenu} role="listbox">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`${styles.priorityOption} ${styles[`priority${option.label}`]}`}
                  onClick={() => {
                    onPriorityChange(task.id, option.key);
                    setPriorityOpen(false);
                  }}
                  disabled={task.priority === option.key}
                >
                  <span className={styles.priorityFlag} aria-hidden="true">
                    <svg viewBox="0 0 20 20" focusable="false">
                      <path
                        d="M5 3v14M6 4h8l-2.2 3L14 10H6z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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
  tasks: UITask[];
}) {
  const grouped = useMemo(() => {
    const map: Record<Status, UITask[]> = { doing: [], blocked: [], help: [], done: [] };
    for (const t of tasks) map[t.status].push(t);
    (Object.keys(map) as Status[]).forEach((status) => {
      map[status].sort((a, b) => b.sortOrder - a.sortOrder);
    });
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
                  onPriorityChange={() => {}}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                  isDragging={false}
                  readOnly
                />
              ))
            )}
          </Column>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const {
    dailyBoards,
    todayKey,
    isLoading,
    isOnline,
    addTask,
    moveTask,
    editTask,
    updatePriority,
    updateTaskPosition,
    deleteTask,
  } = useTasks();
  const { lastActivity, addActivity } = useActivity();

  const [showHistorical, setShowHistorical] = useState(false);
  const [filterPerson, setFilterPerson] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [person, setPerson] = useState("");
  const [notes, setNotes] = useState("");
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const personInputRef = useRef<HTMLInputElement | null>(null);

  const dateLabel = todayLabel();

  const todayTasks = useMemo(() => {
    return (dailyBoards[todayKey] || []).map(toUITask);
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

  const filterTasks = useCallback((tasks: UITask[]) => {
    if (filterPerson === "all") return tasks;
    return tasks.filter((task) => task.person === filterPerson);
  }, [filterPerson]);

  const groupedAll = useMemo(() => {
    const map: Record<Status, UITask[]> = { doing: [], blocked: [], help: [], done: [] };
    for (const t of todayTasks) map[t.status].push(t);
    (Object.keys(map) as Status[]).forEach((status) => {
      map[status].sort((a, b) => b.sortOrder - a.sortOrder);
    });
    return map;
  }, [todayTasks]);

  const grouped = useMemo(() => {
    const map: Record<Status, UITask[]> = { doing: [], blocked: [], help: [], done: [] };
    const filtered = filterPerson === "all" ? todayTasks : todayTasks.filter((task) => task.person === filterPerson);
    for (const t of filtered) map[t.status].push(t);
    (Object.keys(map) as Status[]).forEach((status) => {
      map[status].sort((a, b) => b.sortOrder - a.sortOrder);
    });
    return map;
  }, [todayTasks, filterPerson]);

  const historicalDates = useMemo(() => {
    return Object.keys(dailyBoards)
      .filter((key) => key !== todayKey)
      .sort((a, b) => b.localeCompare(a));
  }, [dailyBoards, todayKey]);

  const todaySummary = useMemo(() => {
    const allToday = dailyBoards[todayKey] || [];
    const total = allToday.length;
    const blocked = allToday.filter((t) => t.status === "blocked").length;
    const help = allToday.filter((t) => t.status === "help").length;
    const done = allToday.filter((t) => t.status === "done").length;
    const active = Math.max(total - done, 0);
    if (total === 0) {
      return "Todays focus: 0 tasks";
    }
    return `Todays focus: ${active} active · ${blocked} blocked · ${help} needs help · ${done} completed`;
  }, [dailyBoards, todayKey]);

  async function handleAddTask() {
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

    const newTask = await addTask(cleanTitle, cleanPerson, notes.trim() || undefined);
    if (newTask) {
      addActivity(`${cleanPerson} added "${cleanTitle}"`);
    }
    setTitle("");
    setPerson("");
    setNotes("");
  }

  async function handleMoveTask(id: string, status: Status) {
    const task = todayTasks.find((t) => t.id === id);
    const updatedTask = await moveTask(id, status);
    if (task && updatedTask && task.status !== status) {
      const statusLabel =
        status === "doing" ? "Doing" : status === "blocked" ? "Blocked" : status === "help" ? "Need Help" : "Completed";
      addActivity(`${task.person} moved "${task.title}" to ${statusLabel}`);
    }
  }

  async function handleDeleteTask(id: string) {
    const task = todayTasks.find((t) => t.id === id);
    const deletedTask = await deleteTask(id);
    if (task && deletedTask) {
      addActivity(`${task.person} deleted "${task.title}"`);
    }
  }

  async function handleEditTask(id: string, updates: { title: string; person: string; notes?: string }) {
    await editTask(id, updates);
  }

  async function handlePriorityChange(id: string, priority: Priority) {
    const task = todayTasks.find((t) => t.id === id);
    const updatedTask = await updatePriority(id, priority);
    if (task && updatedTask && task.priority !== priority) {
      const label =
        priority === "high" ? "high" : priority === "medium" ? "medium" : priority === "low" ? "low" : "no";
      addActivity(`${task.person} set "${task.title}" to ${label} priority`);
    }
  }

  const getDropSortOrder = (tasks: UITask[], insertIndex: number) => {
    const bump = 1000;
    if (tasks.length === 0) return Date.now();

    const prev = tasks[insertIndex - 1];
    const next = tasks[insertIndex];

    if (!prev && next) return next.sortOrder + bump;
    if (prev && !next) return prev.sortOrder - bump;
    if (prev && next) return (prev.sortOrder + next.sortOrder) / 2;
    return Date.now();
  };

  const getDraggedTaskId = (event?: React.DragEvent) => {
    return draggingTaskId || event?.dataTransfer.getData("text/plain") || null;
  };

  const getInsertIndexFromEvent = (
    event: React.DragEvent,
    draggedId: string | null,
    clientYOverride?: number
  ) => {
    const column = event.currentTarget as HTMLElement;
    const taskEls = Array.from(column.querySelectorAll<HTMLElement>("[data-task-id]"));
    let insertIndex = 0;

    for (const el of taskEls) {
      if (el.dataset.taskId === draggedId) continue;
      const rect = el.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const pointerY = clientYOverride ?? event.clientY;
      if (pointerY < midpoint) {
        return insertIndex;
      }
      insertIndex += 1;
    }

    return insertIndex;
  };

  const getColumnDropY = (event: React.DragEvent, status: Status) => {
    const listForOrdering = filterPerson === "all" ? groupedAll[status] : grouped[status];
    if (listForOrdering.length > 0) return event.clientY;
    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    return rect.top + rect.height / 2;
  };

  async function handleDropOnColumn(status: Status, event: React.DragEvent) {
    event.preventDefault();
    const draggedId = getDraggedTaskId(event);
    if (!draggedId) return;

    const listForOrdering = filterPerson === "all" ? groupedAll[status] : grouped[status];
    const targetList = listForOrdering.filter((t) => t.id !== draggedId);
    const dropY = getColumnDropY(event, status);
    const insertIndex = getInsertIndexFromEvent(event, draggedId, dropY);
    const sortOrder = getDropSortOrder(targetList, insertIndex);
    const draggedTask = todayTasks.find((t) => t.id === draggedId);
    const updatedTask = await updateTaskPosition(draggedId, { status, sort_order: sortOrder });
    setDraggingTaskId(null);

    if (draggedTask && updatedTask && draggedTask.status !== status) {
      const statusLabel =
        status === "doing"
          ? "Doing"
          : status === "blocked"
            ? "Blocked"
            : status === "help"
              ? "Need Help"
              : "Completed";
      addActivity(`${draggedTask.person} moved "${draggedTask.title}" to ${statusLabel}`);
    }
  }

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.top}>
          <div>
            <h1 className={styles.title}>
              Work
              <br />
              Board
            </h1>
            <div className={styles.badge}>Internal</div>
          </div>
          <div className={styles.subtitle}>Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.title}>
            Work
            <br />
            Board
          </h1>
          <div className={styles.badge}>Internal</div>
          {!isOnline && (
            <div className={styles.offlineBadge} title="Working offline - changes saved locally">
              Offline
            </div>
          )}
        </div>

        <div>
          <div className={styles.subtitle}>Shared view of current work, blockers, and help needed.</div>
          <div className={styles.contextBar}>
            <div className={styles.contextPrimary}>{todaySummary}</div>
            <div className={styles.contextSecondary}>
              {lastActivity
                ? `Last update: ${lastActivity.message} · ${formatRelativeTime(lastActivity.created_at)}`
                : "Last update: No recent activity"}
            </div>
          </div>
        </div>
      </div>

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
              <svg className={styles.filterIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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

      <div className={styles.board}>
        {COLUMNS.map((col) => (
          <Column
            key={col.key}
            title={col.title}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => handleDropOnColumn(col.key, event)}
          >
            {grouped[col.key].length === 0 ? (
              <div className={styles.columnEmpty}>No items</div>
            ) : (
              grouped[col.key].map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onMove={handleMoveTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onPriorityChange={handlePriorityChange}
                  onDragStart={(id) => setDraggingTaskId(id)}
                  onDragEnd={() => setDraggingTaskId(null)}
                  isDragging={draggingTaskId === t.id}
                />
              ))
            )}
          </Column>
        ))}
      </div>

      {showHistorical && historicalDates.length > 0 && (
        <div className={styles.historicalSection}>
          <h2 className={styles.historicalTitle}>Historical Tasks</h2>
          {historicalDates.map((dateKey) => (
            <HistoricalDaySection
              key={dateKey}
              dateKey={dateKey}
              tasks={filterTasks((dailyBoards[dateKey] || []).map(toUITask))}
            />
          ))}
        </div>
      )}

      <div className={styles.addSection} id="add-task">
        <h2 className={styles.addTitle}>Add a Task:</h2>

        <form
          className={styles.addForm}
          onSubmit={(e) => {
            e.preventDefault();
            handleAddTask();
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
