/*
  # Franklin Planner Integration Database Schema
  
  1. New Tables
    - `values` - Personal values and life principles
    - `annual_goals` - Yearly goals aligned with values
    - `monthly_goals` - Monthly goals (children of annual goals)
    - `weekly_plans` - Weekly planning with priorities
    - `daily_tasks` - Daily tasks with 4-quadrant priority matrix
    - `weekly_reviews` - Weekly reflection and progress tracking
    - `daily_reviews` - Daily reflection
  
  2. Security
    - Enable RLS on all tables
    - All data is user-specific
    - Users can only access their own data
  
  3. Key Features
    - Hierarchical goals: Annual → Monthly → Weekly → Daily
    - Covey 4-Quadrant Matrix: Important/Urgent classification
    - User authentication integration
*/

-- Extend existing todos table with Franklin Planner fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE todos ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'quadrant'
  ) THEN
    ALTER TABLE todos ADD COLUMN quadrant integer DEFAULT 3;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'weekly_plan_id'
  ) THEN
    ALTER TABLE todos ADD COLUMN weekly_plan_id uuid;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'goal_id'
  ) THEN
    ALTER TABLE todos ADD COLUMN goal_id uuid;
  END IF;
END $$;

-- Values table
CREATE TABLE IF NOT EXISTS values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own values"
  ON values FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Annual goals table
CREATE TABLE IF NOT EXISTS annual_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value_id uuid REFERENCES values(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  year integer NOT NULL,
  status text DEFAULT 'active',
  progress integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE annual_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own annual goals"
  ON annual_goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Monthly goals table
CREATE TABLE IF NOT EXISTS monthly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  annual_goal_id uuid NOT NULL REFERENCES annual_goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  month integer NOT NULL,
  year integer NOT NULL,
  status text DEFAULT 'active',
  progress integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own monthly goals"
  ON monthly_goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Weekly plans table
CREATE TABLE IF NOT EXISTS weekly_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_goal_id uuid REFERENCES monthly_goals(id) ON DELETE SET NULL,
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  theme text,
  focus text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own weekly plans"
  ON weekly_plans FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update todos table foreign key
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'weekly_plan_id'
  ) THEN
    ALTER TABLE todos ADD CONSTRAINT fk_todos_weekly_plans
      FOREIGN KEY (weekly_plan_id) REFERENCES weekly_plans(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Update todos RLS to work with authenticated users
DROP POLICY IF EXISTS "Anyone can view todos" ON todos;
DROP POLICY IF EXISTS "Anyone can insert todos" ON todos;
DROP POLICY IF EXISTS "Anyone can update todos" ON todos;
DROP POLICY IF EXISTS "Anyone can delete todos" ON todos;

CREATE POLICY "Users can view their own todos"
  ON todos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos"
  ON todos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos"
  ON todos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos"
  ON todos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Weekly reviews table
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_plan_id uuid NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  what_went_well text,
  what_could_improve text,
  wins text,
  learnings text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own weekly reviews"
  ON weekly_reviews FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily reviews table
CREATE TABLE IF NOT EXISTS daily_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_date date NOT NULL,
  gratitude text,
  wins text,
  improvements text,
  tomorrow_focus text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE daily_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own daily reviews"
  ON daily_reviews FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
