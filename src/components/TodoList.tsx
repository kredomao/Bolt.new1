import { useState, useEffect } from 'react';
import { Check, Trash2, Edit2, Plus, Calendar } from 'lucide-react';
import { supabase, Todo } from '../lib/supabase';
import TodoForm from './TodoForm';

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching todos:', error);
    } else {
      setTodos(data || []);
    }
    setLoading(false);
  }

  async function toggleComplete(todo: Todo) {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !todo.completed, updated_at: new Date().toISOString() })
      .eq('id', todo.id);

    if (error) {
      console.error('Error updating todo:', error);
    } else {
      fetchTodos();
    }
  }

  async function deleteTodo(id: string) {
    if (!confirm('このToDoを削除しますか？')) return;

    const { error } = await supabase.from('todos').delete().eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
    } else {
      fetchTodos();
    }
  }

  function handleEdit(todo: Todo) {
    setEditingTodo(todo);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingTodo(null);
    fetchTodos();
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '期日なし';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">ToDoリスト</h1>
          <p className="text-gray-600">タスクを整理して、生産的な一日を</p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-xl hover:scale-[1.02]"
        >
          <Plus size={24} />
          新しいToDoを追加
        </button>

        {todos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              まだToDoがありません。新しいタスクを追加してみましょう！
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden ${
                  todo.completed ? 'opacity-75' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleComplete(todo)}
                      className={`flex-shrink-0 mt-1 w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                        todo.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {todo.completed && <Check size={16} className="text-white" />}
                    </button>

                    <div className="flex-grow">
                      <h3
                        className={`text-xl font-semibold mb-2 ${
                          todo.completed
                            ? 'line-through text-gray-500'
                            : 'text-gray-800'
                        }`}
                      >
                        {todo.title}
                      </h3>
                      {todo.content && (
                        <p
                          className={`mb-3 leading-relaxed ${
                            todo.completed ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {todo.content}
                        </p>
                      )}
                      {todo.due_date && (
                        <div
                          className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full ${
                            isOverdue(todo.due_date) && !todo.completed
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Calendar size={14} />
                          {formatDate(todo.due_date)}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 flex gap-2">
                      <button
                        onClick={() => handleEdit(todo)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="編集"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="削除"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <TodoForm
          todo={editingTodo}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
