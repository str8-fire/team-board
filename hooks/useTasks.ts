"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Task, Status, DailyBoard } from "@/lib/database.types";

const STORAGE_KEY = "workboard-daily-tasks";

const now = () => new Date().toISOString();

const getDateKey = (date: Date = new Date()) => {
  return date.toISOString().split("T")[0];
};

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

  const formatDate = (date: Date) => date.toISOString();

  return {
    [threeDaysAgoKey]: [
      {
        id: crypto.randomUUID(),
        title: "Design new logo concepts",
        person: "Wizard",
        notes: "Need 3 variations",
        status: "done",
        updated_at: formatDate(threeDaysAgo),
        date: threeDaysAgoKey,
        continued: false,
        created_at: formatDate(threeDaysAgo),
      },
      {
        id: crypto.randomUUID(),
        title: "Review vendor contracts",
        person: "T",
        notes: null,
        status: "blocked",
        updated_at: formatDate(threeDaysAgo),
        date: threeDaysAgoKey,
        continued: false,
        created_at: formatDate(threeDaysAgo),
      },
    ],
    [twoDaysAgoKey]: [
      {
        id: crypto.randomUUID(),
        title: "Review vendor contracts",
        person: "T",
        notes: null,
        status: "blocked",
        updated_at: formatDate(twoDaysAgo),
        date: twoDaysAgoKey,
        continued: true,
        created_at: formatDate(twoDaysAgo),
      },
      {
        id: crypto.randomUUID(),
        title: "Update product descriptions",
        person: "CS",
        notes: "Focus on SEO keywords",
        status: "doing",
        updated_at: formatDate(twoDaysAgo),
        date: twoDaysAgoKey,
        continued: false,
        created_at: formatDate(twoDaysAgo),
      },
      {
        id: crypto.randomUUID(),
        title: "Send weekly newsletter",
        person: "Marketing",
        notes: null,
        status: "done",
        updated_at: formatDate(twoDaysAgo),
        date: twoDaysAgoKey,
        continued: false,
        created_at: formatDate(twoDaysAgo),
      },
    ],
    [yesterdayKey]: [
      {
        id: crypto.randomUUID(),
        title: "Review vendor contracts",
        person: "T",
        notes: null,
        status: "help",
        updated_at: formatDate(yesterday),
        date: yesterdayKey,
        continued: true,
        created_at: formatDate(yesterday),
      },
      {
        id: crypto.randomUUID(),
        title: "Update product descriptions",
        person: "CS",
        notes: "Focus on SEO keywords",
        status: "doing",
        updated_at: formatDate(yesterday),
        date: yesterdayKey,
        continued: true,
        created_at: formatDate(yesterday),
      },
      {
        id: crypto.randomUUID(),
        title: "Prepare Q1 report",
        person: "Finance",
        notes: null,
        status: "done",
        updated_at: formatDate(yesterday),
        date: yesterdayKey,
        continued: false,
        created_at: formatDate(yesterday),
      },
      {
        id: crypto.randomUUID(),
        title: "Fix checkout bug",
        person: "Dev",
        notes: "Payment gateway timeout issue",
        status: "blocked",
        updated_at: formatDate(yesterday),
        date: yesterdayKey,
        continued: false,
        created_at: formatDate(yesterday),
      },
    ],
    [todayKey]: [
      {
        id: crypto.randomUUID(),
        title: "Review vendor contracts",
        person: "T",
        notes: null,
        status: "help",
        updated_at: formatDate(today),
        date: todayKey,
        continued: true,
        created_at: formatDate(today),
      },
      {
        id: crypto.randomUUID(),
        title: "Update product descriptions",
        person: "CS",
        notes: "Focus on SEO keywords",
        status: "doing",
        updated_at: formatDate(today),
        date: todayKey,
        continued: true,
        created_at: formatDate(today),
      },
      {
        id: crypto.randomUUID(),
        title: "Fix checkout bug",
        person: "Dev",
        notes: "Payment gateway timeout issue",
        status: "doing",
        updated_at: formatDate(today),
        date: todayKey,
        continued: true,
        created_at: formatDate(today),
      },
      {
        id: crypto.randomUUID(),
        title: "DNGR website edits",
        person: "Wizard",
        notes: null,
        status: "doing",
        updated_at: formatDate(today),
        date: todayKey,
        continued: false,
        created_at: formatDate(today),
      },
      {
        id: crypto.randomUUID(),
        title: "Approve packaging colors",
        person: "T",
        notes: null,
        status: "blocked",
        updated_at: formatDate(today),
        date: todayKey,
        continued: false,
        created_at: formatDate(today),
      },
      {
        id: crypto.randomUUID(),
        title: "Reply to customer emails",
        person: "CS",
        notes: "Refund + address changes",
        status: "help",
        updated_at: formatDate(today),
        date: todayKey,
        continued: false,
        created_at: formatDate(today),
      },
    ],
  };
}

function groupTasksByDate(tasks: Task[]): DailyBoard {
  const boards: DailyBoard = {};
  for (const task of tasks) {
    if (!boards[task.date]) {
      boards[task.date] = [];
    }
    boards[task.date].push(task);
  }
  return boards;
}

function carryOverTasks(boards: DailyBoard, currentDateKey: string): DailyBoard {
  const existingTodayTasks = boards[currentDateKey] || [];
  const existingTodayTaskIds = new Set(existingTodayTasks.map((t) => t.id));
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
            updated_at: now(),
            created_at: now(),
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

  return boards;
}

async function loadFromLocalStorage(): Promise<DailyBoard> {
  if (typeof window === "undefined") return {};
  
  const stored = localStorage.getItem(STORAGE_KEY);
  let boards: DailyBoard = {};

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      for (const dateKey of Object.keys(parsed)) {
        boards[dateKey] = parsed[dateKey].map((t: Record<string, unknown>) => ({
          ...t,
          updated_at: t.updatedAt || t.updated_at,
          created_at: t.created_at || t.updatedAt || now(),
          notes: t.notes || null,
          continued: t.continued || false,
        }));
      }
    } catch {
      boards = {};
    }
  }

  const totalTasks = Object.values(boards).reduce((sum, tasks) => sum + tasks.length, 0);
  if (Object.keys(boards).length === 0 || totalTasks === 0) {
    boards = generateSampleData();
  }

  return boards;
}

function saveToLocalStorage(boards: DailyBoard) {
  if (typeof window === "undefined") return;
  const toSave: Record<string, unknown[]> = {};
  for (const dateKey of Object.keys(boards)) {
    toSave[dateKey] = boards[dateKey].map((t) => ({
      ...t,
      updatedAt: t.updated_at,
    }));
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function useTasks() {
  const [dailyBoards, setDailyBoards] = useState<DailyBoard>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const todayKey = getDateKey();
  const subscriptionRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          let boards = groupTasksByDate(data as Task[]);
          boards = carryOverTasks(boards, todayKey);
          setDailyBoards(boards);
          setIsOnline(true);
        } else {
          const sampleData = generateSampleData();
          const allTasks = Object.values(sampleData).flat();
          
          const { error: insertError } = await supabase
            .from("tasks")
            .insert(allTasks as Task[]);
          
          if (insertError) throw insertError;
          
          setDailyBoards(sampleData);
          setIsOnline(true);
        }
      } catch (error) {
        console.error("Failed to load from Supabase, falling back to localStorage:", error);
        const boards = await loadFromLocalStorage();
        const processedBoards = carryOverTasks(boards, todayKey);
        setDailyBoards(processedBoards);
        saveToLocalStorage(processedBoards);
        setIsOnline(false);
      }
    } else {
      const boards = await loadFromLocalStorage();
      const processedBoards = carryOverTasks(boards, todayKey);
      setDailyBoards(processedBoards);
      saveToLocalStorage(processedBoards);
      setIsOnline(false);
    }
    
    setIsLoading(false);
  }, [todayKey]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTask = payload.new as Task;
            setDailyBoards((prev) => {
              const dateKey = newTask.date;
              const existing = prev[dateKey] || [];
              if (existing.some((t) => t.id === newTask.id)) {
                return prev;
              }
              return {
                ...prev,
                [dateKey]: [newTask, ...existing],
              };
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedTask = payload.new as Task;
            setDailyBoards((prev) => {
              const dateKey = updatedTask.date;
              const existing = prev[dateKey] || [];
              return {
                ...prev,
                [dateKey]: existing.map((t) =>
                  t.id === updatedTask.id ? updatedTask : t
                ),
              };
            });
          } else if (payload.eventType === "DELETE") {
            const deletedTask = payload.old as Task;
            setDailyBoards((prev) => {
              const newBoards = { ...prev };
              for (const dateKey of Object.keys(newBoards)) {
                newBoards[dateKey] = newBoards[dateKey].filter(
                  (t) => t.id !== deletedTask.id
                );
              }
              return newBoards;
            });
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current && supabase) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOnline && Object.keys(dailyBoards).length > 0) {
      saveToLocalStorage(dailyBoards);
    }
  }, [dailyBoards, isOnline]);

  const addTask = useCallback(
    async (title: string, person: string, notes?: string): Promise<Task | null> => {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title,
        person,
        notes: notes || null,
        status: "doing",
        updated_at: now(),
        date: todayKey,
        continued: false,
        created_at: now(),
      };

      setDailyBoards((prev) => ({
        ...prev,
        [todayKey]: [newTask, ...(prev[todayKey] || [])],
      }));

      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase.from("tasks").insert(newTask);
          if (error) throw error;
        } catch (error) {
          console.error("Failed to add task to Supabase:", error);
          saveToLocalStorage({
            ...dailyBoards,
            [todayKey]: [newTask, ...(dailyBoards[todayKey] || [])],
          });
        }
      } else {
        saveToLocalStorage({
          ...dailyBoards,
          [todayKey]: [newTask, ...(dailyBoards[todayKey] || [])],
        });
      }

      return newTask;
    },
    [todayKey, dailyBoards]
  );

  const moveTask = useCallback(
    async (id: string, status: Status): Promise<Task | null> => {
      const task = (dailyBoards[todayKey] || []).find((t) => t.id === id);
      if (!task) return null;

      const updatedTask = { ...task, status, updated_at: now() };

      setDailyBoards((prev) => ({
        ...prev,
        [todayKey]: (prev[todayKey] || []).map((t) =>
          t.id === id ? updatedTask : t
        ),
      }));

      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase
            .from("tasks")
            .update({ status, updated_at: now() })
            .eq("id", id);
          if (error) throw error;
        } catch (error) {
          console.error("Failed to update task in Supabase:", error);
        }
      } else {
        const newBoards = {
          ...dailyBoards,
          [todayKey]: (dailyBoards[todayKey] || []).map((t) =>
            t.id === id ? updatedTask : t
          ),
        };
        saveToLocalStorage(newBoards);
      }

      return updatedTask;
    },
    [todayKey, dailyBoards]
  );

  const editTask = useCallback(
    async (
      id: string,
      updates: { title: string; person: string; notes?: string }
    ): Promise<Task | null> => {
      const task = (dailyBoards[todayKey] || []).find((t) => t.id === id);
      if (!task) return null;

      const updatedTask = {
        ...task,
        ...updates,
        notes: updates.notes || null,
        updated_at: now(),
      };

      setDailyBoards((prev) => ({
        ...prev,
        [todayKey]: (prev[todayKey] || []).map((t) =>
          t.id === id ? updatedTask : t
        ),
      }));

      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase
            .from("tasks")
            .update({
              title: updates.title,
              person: updates.person,
              notes: updates.notes || null,
              updated_at: now(),
            })
            .eq("id", id);
          if (error) throw error;
        } catch (error) {
          console.error("Failed to edit task in Supabase:", error);
        }
      } else {
        const newBoards = {
          ...dailyBoards,
          [todayKey]: (dailyBoards[todayKey] || []).map((t) =>
            t.id === id ? updatedTask : t
          ),
        };
        saveToLocalStorage(newBoards);
      }

      return updatedTask;
    },
    [todayKey, dailyBoards]
  );

  const deleteTask = useCallback(
    async (id: string): Promise<Task | null> => {
      const task = (dailyBoards[todayKey] || []).find((t) => t.id === id);
      if (!task) return null;

      setDailyBoards((prev) => ({
        ...prev,
        [todayKey]: (prev[todayKey] || []).filter((t) => t.id !== id),
      }));

      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase.from("tasks").delete().eq("id", id);
          if (error) throw error;
        } catch (error) {
          console.error("Failed to delete task from Supabase:", error);
        }
      } else {
        const newBoards = {
          ...dailyBoards,
          [todayKey]: (dailyBoards[todayKey] || []).filter((t) => t.id !== id),
        };
        saveToLocalStorage(newBoards);
      }

      return task;
    },
    [todayKey, dailyBoards]
  );

  return {
    dailyBoards,
    todayKey,
    isLoading,
    isOnline,
    addTask,
    moveTask,
    editTask,
    deleteTask,
  };
}
