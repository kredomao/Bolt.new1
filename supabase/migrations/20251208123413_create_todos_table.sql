/*
  # Create todos table

  1. New Tables
    - `todos`
      - `id` (uuid, primary key) - ユニークID
      - `title` (text, not null) - ToDoのタイトル
      - `content` (text) - ToDoの詳細内容
      - `due_date` (date) - 期日
      - `completed` (boolean, default false) - 完了状態
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

  2. Security
    - Enable RLS on `todos` table
    - Add policies for public access (simple todo app without authentication)
*/

CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text DEFAULT '',
  due_date date,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view todos"
  ON todos FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert todos"
  ON todos FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update todos"
  ON todos FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete todos"
  ON todos FOR DELETE
  TO anon
  USING (true);