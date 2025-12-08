import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Todo {
  id: string;
  title: string;
  content: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}
