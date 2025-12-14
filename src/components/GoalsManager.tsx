import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, AnnualGoal, MonthlyGoal, Value } from '../lib/supabase';
import { Plus, Trash2, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';

type GoalType = 'annual' | 'monthly';

export default function GoalsManager() {
  const { user } = useAuth();
  const [values, setValues] = useState<Value[]>([]);
  const [annualGoals, setAnnualGoals] = useState<AnnualGoal[]>([]);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>('annual');
  const [editingGoal, setEditingGoal] = useState<AnnualGoal | MonthlyGoal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    valueId: '',
    annualGoalId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [valuesRes, annualRes, monthlyRes] = await Promise.all([
        supabase.from('values').select('*').eq('user_id', user?.id).order('priority'),
        supabase
          .from('annual_goals')
          .select('*')
          .eq('user_id', user?.id)
          .order('year', { ascending: false }),
        supabase
          .from('monthly_goals')
          .select('*')
          .eq('user_id', user?.id)
          .order('year', { ascending: false })
          .order('month', { ascending: false }),
      ]);

      setValues(valuesRes.data || []);
      setAnnualGoals(annualRes.data || []);
      setMonthlyGoals(monthlyRes.data || []);
    } catch (error) {
      console.error('目標の取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      if (goalType === 'annual') {
        if (editingGoal && 'year' in editingGoal) {
          const { error } = await supabase
            .from('annual_goals')
            .update({
              title: formData.title.trim(),
              description: formData.description.trim(),
              value_id: formData.valueId || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', editingGoal.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from('annual_goals').insert([
            {
              user_id: user?.id,
              title: formData.title.trim(),
              description: formData.description.trim(),
              value_id: formData.valueId || null,
              year: new Date().getFullYear(),
            },
          ]);

          if (error) throw error;
        }
      } else {
        if (editingGoal && 'annual_goal_id' in editingGoal) {
          const { error } = await supabase
            .from('monthly_goals')
            .update({
              title: formData.title.trim(),
              description: formData.description.trim(),
              month: formData.month,
              year: formData.year,
              updated_at: new Date().toISOString(),
            })
            .eq('id', editingGoal.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from('monthly_goals').insert([
            {
              user_id: user?.id,
              annual_goal_id: formData.annualGoalId,
              title: formData.title.trim(),
              description: formData.description.trim(),
              month: formData.month,
              year: formData.year,
            },
          ]);

          if (error) throw error;
        }
      }

      handleClose();
      fetchAllData();
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  async function deleteGoal(id: string, type: GoalType) {
    if (!confirm('この目標を削除しますか？')) return;

    try {
      const table = type === 'annual' ? 'annual_goals' : 'monthly_goals';
      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) throw error;
      fetchAllData();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  }

  function handleEdit(goal: AnnualGoal | MonthlyGoal, type: GoalType) {
    setEditingGoal(goal);
    setGoalType(type);
    setFormData({
      title: goal.title,
      description: goal.description,
      valueId: 'value_id' in goal ? goal.value_id || '' : '',
      annualGoalId: 'annual_goal_id' in goal ? goal.annual_goal_id : '',
      month: 'month' in goal ? goal.month : new Date().getMonth() + 1,
      year: 'year' in goal ? goal.year : new Date().getFullYear(),
    });
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditingGoal(null);
    setFormData({
      title: '',
      description: '',
      valueId: '',
      annualGoalId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });
  }

  if (loading) {
    return <div className="text-gray-600">読み込み中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">目標管理</h1>
        <p className="text-gray-600">年間目標から月間目標への階層的な計画</p>
      </div>

      {/* Goal Type Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setGoalType('annual')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            goalType === 'annual'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          年間目標
        </button>
        <button
          onClick={() => setGoalType('monthly')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            goalType === 'monthly'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          月間目標
        </button>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-xl"
      >
        <Plus size={24} />
        新しい{goalType === 'annual' ? '年間' : '月間'}目標を追加
      </button>

      {goalType === 'annual' ? (
        // Annual Goals View
        annualGoals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">まだ年間目標が登録されていません。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {annualGoals.map((goal) => (
              <div key={goal.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">{goal.title}</h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          {goal.year}年
                        </span>
                      </div>
                      {goal.description && (
                        <p className="text-gray-600 mb-3">{goal.description}</p>
                      )}
                      {goal.value_id && (
                        <p className="text-sm text-gray-500">
                          価値観: {values.find((v) => v.id === goal.value_id)?.title}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                      <button
                        onClick={() => handleEdit(goal, 'annual')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id, 'annual')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Related Monthly Goals */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {expandedGoal === goal.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      関連する月間目標({monthlyGoals.filter((m) => m.annual_goal_id === goal.id).length})
                    </button>

                    {expandedGoal === goal.id && (
                      <div className="mt-3 space-y-2 pl-4">
                        {monthlyGoals
                          .filter((m) => m.annual_goal_id === goal.id)
                          .map((mg) => (
                            <div key={mg.id} className="bg-gray-50 rounded-lg p-3">
                              <p className="font-medium text-gray-700">{mg.title}</p>
                              <p className="text-xs text-gray-500">
                                {mg.year}年 {mg.month}月
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Monthly Goals View
        monthlyGoals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">まだ月間目標が登録されていません。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {monthlyGoals.map((goal) => {
              const parentGoal = annualGoals.find((ag) => ag.id === goal.annual_goal_id);
              return (
                <div key={goal.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">{goal.title}</h3>
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                          {goal.year}年 {goal.month}月
                        </span>
                      </div>
                      {goal.description && (
                        <p className="text-gray-600 mb-3">{goal.description}</p>
                      )}
                      {parentGoal && (
                        <p className="text-sm text-gray-500">
                          親目標: <span className="font-medium">{parentGoal.title}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                      <button
                        onClick={() => handleEdit(goal, 'monthly')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id, 'monthly')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingGoal ? `${goalType === 'annual' ? '年間' : '月間'}目標を編集` : `新しい${goalType === 'annual' ? '年間' : '月間'}目標を追加`}
              </h2>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                  目標の名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="目標を入力..."
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="目標の詳しい説明..."
                />
              </div>

              {goalType === 'annual' && (
                <div>
                  <label htmlFor="valueId" className="block text-sm font-semibold text-gray-700 mb-2">
                    関連する価値観
                  </label>
                  <select
                    id="valueId"
                    value={formData.valueId}
                    onChange={(e) => setFormData({ ...formData, valueId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">選択してください</option>
                    {values.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {goalType === 'monthly' && (
                <>
                  <div>
                    <label htmlFor="annualGoalId" className="block text-sm font-semibold text-gray-700 mb-2">
                      親の年間目標 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="annualGoalId"
                      value={formData.annualGoalId}
                      onChange={(e) => setFormData({ ...formData, annualGoalId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">選択してください</option>
                      {annualGoals.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="year" className="block text-sm font-semibold text-gray-700 mb-2">
                        年
                      </label>
                      <input
                        type="number"
                        id="year"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        min="2020"
                        max="2030"
                      />
                    </div>
                    <div>
                      <label htmlFor="month" className="block text-sm font-semibold text-gray-700 mb-2">
                        月
                      </label>
                      <select
                        id="month"
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}月
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

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
                  disabled={saving || !formData.title.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? '保存中...' : editingGoal ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
