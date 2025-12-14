import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';
import { supabase, Todo, WeeklyPlan } from '../lib/supabase';

interface TodoFormProps {
  todo: Todo | null;
  onClose: () => void;
  weeklyPlans?: WeeklyPlan[];
}

export default function TodoForm({ todo, onClose, weeklyPlans = [] }: TodoFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [quadrant, setQuadrant] = useState<1 | 2 | 3 | 4>(3);
  const [weeklyPlanId, setWeeklyPlanId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setContent(todo.content);
      setDueDate(todo.due_date || '');
      setQuadrant(todo.quadrant);
      setWeeklyPlanId(todo.weekly_plan_id || '');
    }
  }, [todo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);

    const todoData = {
      title: title.trim(),
      content: content.trim(),
      due_date: dueDate || null,
      quadrant,
      weekly_plan_id: weeklyPlanId || null,
      updated_at: new Date().toISOString(),
    };

    if (todo) {
      const { error } = await supabase
        .from('todos')
        .update(todoData)
        .eq('id', todo.id);

      if (error) {
        console.error('Error updating todo:', error);
        alert('ToDoの更新に失敗しました');
      } else {
        onClose();
      }
    } else {
      const { error } = await supabase.from('todos').insert([{ ...todoData, user_id: user?.id }]);

      if (error) {
        console.error('Error creating todo:', error);
        alert('ToDoの作成に失敗しました');
      } else {
        onClose();
      }
    }

    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {todo ? 'ToDoを編集' : '新しいToDoを追加'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="例：プレゼンテーション資料の作成"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
              内容
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="ToDoの詳細を記入してください..."
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-2">
              期日
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="quadrant" className="block text-sm font-semibold text-gray-700 mb-2">
              優先度（4象限マトリクス）
            </label>
            <select
              id="quadrant"
              value={quadrant}
              onChange={(e) => setQuadrant(parseInt(e.target.value) as 1 | 2 | 3 | 4)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value={1}>🔴 重要かつ緊急</option>
              <option value={2}>🟢 重要だが緊急でない</option>
              <option value={3}>🟡 緊急だが重要でない</option>
              <option value={4}>⚫ 緊急でも重要でもない</option>
            </select>
          </div>

          {weeklyPlans.length > 0 && (
            <div>
              <label htmlFor="weeklyPlanId" className="block text-sm font-semibold text-gray-700 mb-2">
                関連する週間計画
              </label>
              <select
                id="weeklyPlanId"
                value={weeklyPlanId}
                onChange={(e) => setWeeklyPlanId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">選択してください</option>
                {weeklyPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {new Date(plan.week_start_date).toLocaleDateString('ja-JP')} 〜{' '}
                    {new Date(plan.week_end_date).toLocaleDateString('ja-JP')} {plan.theme && `(${plan.theme})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? '保存中...' : todo ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
