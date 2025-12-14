import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Todo, WeeklyPlan } from '../lib/supabase';
import { Plus, Trash2, Edit2, Check, Calendar } from 'lucide-react';
import TodoForm from './TodoForm';

type Quadrant = 1 | 2 | 3 | 4;

const QUADRANTS = {
  1: { label: '重要かつ緊急', color: 'bg-red-50', borderColor: 'border-red-200' },
  2: { label: '重要だが緊急でない', color: 'bg-green-50', borderColor: 'border-green-200' },
  3: { label: '緊急だが重要でない', color: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  4: { label: '緊急でも重要でもない', color: 'bg-gray-50', borderColor: 'border-gray-200' },
};

export default function TasksView() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(null);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [todosRes, plansRes] = await Promise.all([
        supabase
          .from('todos')
          .select('*')
          .eq('user_id', user?.id)
          .order('due_date', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false }),
        supabase.from('weekly_plans').select('*').eq('user_id', user?.id),
      ]);

      setTodos(todosRes.data || []);
      setWeeklyPlans(plansRes.data || []);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleComplete(todo: Todo) {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed, updated_at: new Date().toISOString() })
        .eq('id', todo.id);

      if (error) throw error;
      fetchAllData();
    } catch (error) {
      console.error('更新エラー:', error);
    }
  }

  async function deleteTodo(id: string) {
    if (!confirm('このタスクを削除しますか？')) return;

    try {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
      fetchAllData();
    } catch (error) {
      console.error('削除エラー:', error);
    }
  }

  function handleEdit(todo: Todo) {
    setEditingTodo(todo);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingTodo(null);
    fetchAllData();
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '期日なし';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  function isOverdue(dateString: string | null) {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    return dueDate < today;
  }

  if (loading) {
    return <div className="text-gray-600">読み込み中...</div>;
  }

  const incompleteTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">タスク一覧</h1>
        <p className="text-gray-600">4象限マトリクスで優先順位を管理</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 hover:shadow-xl"
        >
          <Plus size={20} />
          新しいタスク
        </button>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              viewMode === 'matrix'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            マトリクス
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            リスト
          </button>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        // Matrix View
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {([1, 2, 3, 4] as Quadrant[]).map((quad) => {
            const quadTodos = incompleteTodos.filter((t) => t.quadrant === quad);
            const quadInfo = QUADRANTS[quad];

            return (
              <div
                key={quad}
                className={`${quadInfo.color} border-2 ${quadInfo.borderColor} rounded-xl p-6`}
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {quad === 1 && '🔴 '}
                  {quad === 2 && '🟢 '}
                  {quad === 3 && '🟡 '}
                  {quad === 4 && '⚫ '}
                  {quadInfo.label}
                </h3>

                {quadTodos.length === 0 ? (
                  <p className="text-gray-500 text-sm">タスクがありません</p>
                ) : (
                  <div className="space-y-3">
                    {quadTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="bg-white rounded-lg p-3 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleComplete(todo)}
                            className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                              todo.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 hover:border-green-500'
                            }`}
                          >
                            {todo.completed && <Check size={14} className="text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium ${
                                todo.completed
                                  ? 'line-through text-gray-500'
                                  : 'text-gray-800'
                              }`}
                            >
                              {todo.title}
                            </p>
                            {todo.due_date && (
                              <div
                                className={`inline-flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded ${
                                  isOverdue(todo.due_date) && !todo.completed
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                <Calendar size={12} />
                                {formatDate(todo.due_date)}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 flex gap-1">
                            <button
                              onClick={() => handleEdit(todo)}
                              className="p-1 text-blue-600 hover:bg-white rounded transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteTodo(todo.id)}
                              className="p-1 text-red-600 hover:bg-white rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // List View
        <>
          {incompleteTodos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">進行中のタスク</h2>
              <div className="space-y-3">
                {incompleteTodos.map((todo) => {
                  const quadInfo = QUADRANTS[todo.quadrant];
                  return (
                    <div
                      key={todo.id}
                      className={`${quadInfo.color} border-l-4 border-l-blue-500 rounded-lg p-4 hover:shadow-md transition-all`}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleComplete(todo)}
                          className="flex-shrink-0 mt-1 w-6 h-6 rounded-full border-2 border-gray-300 hover:border-green-500 transition-all flex items-center justify-center"
                        >
                          <Check size={16} className="text-green-500 opacity-0" />
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800">{todo.title}</h3>
                            <span className="text-xs px-2 py-1 bg-white rounded">
                              {quadInfo.label.split(' ')[0]}
                            </span>
                          </div>
                          {todo.content && (
                            <p className="text-sm text-gray-600 mb-2">{todo.content}</p>
                          )}
                          {todo.due_date && (
                            <div
                              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                isOverdue(todo.due_date)
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-white text-gray-600'
                              }`}
                            >
                              <Calendar size={12} />
                              {formatDate(todo.due_date)}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex gap-2">
                          <button
                            onClick={() => handleEdit(todo)}
                            className="p-2 text-blue-600 hover:bg-white rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="p-2 text-red-600 hover:bg-white rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {completedTodos.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">完了したタスク</h2>
              <div className="space-y-2 opacity-60">
                {completedTodos.map((todo) => (
                  <div key={todo.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <Check size={20} className="text-green-500" />
                      <p className="line-through text-gray-500">{todo.title}</p>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <TodoForm
          todo={editingTodo}
          onClose={handleFormClose}
          weeklyPlans={weeklyPlans}
        />
      )}
    </div>
  );
}
