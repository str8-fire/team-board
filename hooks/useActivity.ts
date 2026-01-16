"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Activity } from "@/lib/database.types";

const ACTIVITY_KEY = "workboard-last-activity";

const now = () => new Date().toISOString();

function loadFromLocalStorage(): Activity | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(ACTIVITY_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return {
      id: parsed.id || crypto.randomUUID(),
      message: parsed.message,
      created_at: parsed.at || parsed.created_at || now(),
    };
  } catch {
    return null;
  }
}

function saveToLocalStorage(activity: Activity) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    ACTIVITY_KEY,
    JSON.stringify({
      id: activity.id,
      message: activity.message,
      at: activity.created_at,
    })
  );
}

export function useActivity() {
  const [lastActivity, setLastActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const subscriptionRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);

  const loadActivity = useCallback(async () => {
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setLastActivity(data as Activity);
        } else {
          const localActivity = loadFromLocalStorage();
          setLastActivity(localActivity);
        }
      } catch (error) {
        console.error("Failed to load activity from Supabase:", error);
        const localActivity = loadFromLocalStorage();
        setLastActivity(localActivity);
      }
    } else {
      const localActivity = loadFromLocalStorage();
      setLastActivity(localActivity);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel("activities-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        (payload) => {
          const newActivity = payload.new as Activity;
          setLastActivity((prev) => {
            if (!prev || new Date(newActivity.created_at) > new Date(prev.created_at)) {
              return newActivity;
            }
            return prev;
          });
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

  const addActivity = useCallback(async (message: string): Promise<Activity> => {
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      message,
      created_at: now(),
    };

    setLastActivity(newActivity);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from("activities").insert(newActivity);
        if (error) throw error;
      } catch (error) {
        console.error("Failed to add activity to Supabase:", error);
        saveToLocalStorage(newActivity);
      }
    } else {
      saveToLocalStorage(newActivity);
    }

    return newActivity;
  }, []);

  return {
    lastActivity,
    isLoading,
    addActivity,
  };
}
