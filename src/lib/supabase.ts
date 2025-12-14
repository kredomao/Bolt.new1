import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  content: string;
  due_date: string | null;
  completed: boolean;
  quadrant: 1 | 2 | 3 | 4;
  weekly_plan_id: string | null;
  goal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Value {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AnnualGoal {
  id: string;
  user_id: string;
  value_id: string | null;
  title: string;
  description: string;
  year: number;
  status: 'active' | 'completed' | 'archived';
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface MonthlyGoal {
  id: string;
  user_id: string;
  annual_goal_id: string;
  title: string;
  description: string;
  month: number;
  year: number;
  status: 'active' | 'completed' | 'archived';
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  month_goal_id: string | null;
  week_start_date: string;
  week_end_date: string;
  theme: string;
  focus: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReview {
  id: string;
  user_id: string;
  weekly_plan_id: string;
  what_went_well: string;
  what_could_improve: string;
  wins: string;
  learnings: string;
  created_at: string;
  updated_at: string;
}

export interface DailyReview {
  id: string;
  user_id: string;
  review_date: string;
  gratitude: string;
  wins: string;
  improvements: string;
  tomorrow_focus: string;
  created_at: string;
  updated_at: string;
}
