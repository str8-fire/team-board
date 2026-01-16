export type Status = "doing" | "blocked" | "help" | "done";

export type Task = {
  id: string;
  title: string;
  person: string;
  notes: string | null;
  status: Status;
  updated_at: string;
  date: string;
  continued: boolean;
  created_at: string;
};

export type Activity = {
  id: string;
  message: string;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          title: string;
          person: string;
          notes: string | null;
          status: Status;
          updated_at: string;
          date: string;
          continued: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          person: string;
          notes?: string | null;
          status: Status;
          updated_at: string;
          date: string;
          continued: boolean;
          created_at: string;
        };
        Update: {
          id?: string;
          title?: string;
          person?: string;
          notes?: string | null;
          status?: Status;
          updated_at?: string;
          date?: string;
          continued?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id: string;
          message: string;
          created_at: string;
        };
        Update: {
          id?: string;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type DailyBoard = {
  [dateKey: string]: Task[];
};
