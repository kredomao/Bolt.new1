import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Value } from '../lib/supabase';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

export default function ValuesManager() {
  const { user } = useAuth();
  const [values, setValues] = useState<Value[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingValue, setEditingValue] = useState<Value | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchValues();
    }
  }, [user]);

  async function fetchValues() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('values')
        .select('*')
        .eq('user_id', user?.id)
        .order('priority', { ascending: true });

      if (error) throw error;
      setValues(data || []);
    } catch (error) {
      console.error('価値観の取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      if (editingValue) {
        const { error } = await supabase
          .from('values')
          .update({
            title: title.trim(),
            description: description.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingValue.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('values').insert([
          {
            user_id: user?.id,
            title: title.trim(),
            description: description.trim(),
            priority: values.length + 1,
          },
        ]);

        if (error) throw error;
      }

      setTitle('');
      setDescription('');
      setShowForm(false);
      setEditingValue(null);
      fetchValues();
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  async function deleteValue(id: string) {
    if (!confirm('この価値観を削除しますか？')) return;

    try {
      const { error } = await supabase.from('values').delete().eq('id', id);
      if (error) throw error;
      fetchValues();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  }

  function handleEdit(value: Value) {
    setEditingValue(value);
    setTitle(value.title);
    setDescription(value.description);
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditingValue(null);
    setTitle('');
    setDescription('');
  }

  if (loading) {
    return <div className="text-gray-600">読み込み中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">価値観・人生目標</h1>
        <p className="text-gray-600">あなたの人生を導く根本的な価値観を定義します</p>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-xl"
      >
        <Plus size={24} />
        新しい価値観を追加
      </button>

      {values.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">
            まだ価値観が登録されていません。あなたの人生の根本となる価値観を追加してください。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {values.map((value, idx) => (
            <div
              key={value.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{value.title}</h3>
                    {value.description && (
                      <p className="text-gray-600 leading-relaxed">{value.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 flex gap-2">
                  <button
                    onClick={() => handleEdit(value)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="編集"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => deleteValue(value.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="削除"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingValue ? '価値観を編集' : '新しい価値観を追加'}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                  価値観の名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="例：家族との絆、自己成長、健康"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  説明
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="この価値観についての詳しい説明を記入してください..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? '保存中...' : editingValue ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
