import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, WeeklyPlan, MonthlyGoal } from '../lib/supabase';
import { Plus, Trash2, Edit2, X, Calendar } from 'lucide-react';

export default function WeeklyPlanner() {
  const { user } = useAuth();
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WeeklyPlan | null>(null);
  const [formData, setFormData] = useState({
    weekStart: '',
    weekEnd: '',
    theme: '',
    focus: '',
    monthGoalId: '',
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
      const [goalsRes, plansRes] = await Promise.all([
        supabase
          .from('monthly_goals')
          .select('*')
          .eq('user_id', user?.id)
          .order('year', { ascending: false })
          .order('month', { ascending: false }),
        supabase
          .from('weekly_plans')
          .select('*')
          .eq('user_id', user?.id)
          .order('week_start_date', { ascending: false }),
      ]);

      setMonthlyGoals(goalsRes.data || []);
      setWeeklyPlans(plansRes.data || []);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }

  function getDefaultWeekStart() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek);
    return startDate.toISOString().split('T')[0];
  }

  function getDefaultWeekEnd() {
    const startDate = new Date(getDefaultWeekStart());
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return endDate.toISOString().split('T')[0];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.weekStart || !formData.weekEnd) return;

    setSaving(true);
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('weekly_plans')
          .update({
            week_start_date: formData.weekStart,
            week_end_date: formData.weekEnd,
            theme: formData.theme.trim(),
            focus: formData.focus.trim(),
            month_goal_id: formData.monthGoalId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPlan.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('weekly_plans').insert([
          {
            user_id: user?.id,
            week_start_date: formData.weekStart,
            week_end_date: formData.weekEnd,
            theme: formData.theme.trim(),
            focus: formData.focus.trim(),
            month_goal_id: formData.monthGoalId || null,
          },
        ]);

        if (error) throw error;
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

  async function deletePlan(id: string) {
    if (!confirm('この週間計画を削除しますか？')) return;

    try {
      const { error } = await supabase.from('weekly_plans').delete().eq('id', id);
      if (error) throw error;
      fetchAllData();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  }

  function handleEdit(plan: WeeklyPlan) {
    setEditingPlan(plan);
    setFormData({
      weekStart: plan.week_start_date,
      weekEnd: plan.week_end_date,
      theme: plan.theme,
      focus: plan.focus,
      monthGoalId: plan.month_goal_id || '',
    });
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditingPlan(null);
    setFormData({
      weekStart: getDefaultWeekStart(),
      weekEnd: getDefaultWeekEnd(),
      theme: '',
      focus: '',
      monthGoalId: '',
    });
  }

  if (loading) {
    return <div className="text-gray-600">読み込み中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">週間計画</h1>
        <p className="text-gray-600">毎週のテーマを設定し、目標達成に向けて計画を立てます</p>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-xl"
      >
        <Plus size={24} />
        新しい週間計画を作成
      </button>

      {weeklyPlans.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">まだ週間計画が登録されていません。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {weeklyPlans.map((plan) => {
            const relatedGoal = monthlyGoals.find((g) => g.id === plan.month_goal_id);
            const weekNum = Math.ceil(
              (new Date(plan.week_start_date).getDate() -
                (new Date(plan.week_start_date).getDay() || 7) +
                1) /
                7
            );

            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar size={20} className="text-blue-600" />
                      <span className="text-sm text-gray-600">
                        {new Date(plan.week_start_date).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}{' '}
                        〜{' '}
                        {new Date(plan.week_end_date).toLocaleDateString('ja-JP', {
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {plan.theme && (
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">📌 {plan.theme}</h3>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex gap-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {plan.focus && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-blue-900 mb-1">今週の重点</p>
                    <p className="text-gray-700">{plan.focus}</p>
                  </div>
                )}

                {relatedGoal && (
                  <p className="text-sm text-gray-600">
                    関連月間目標: <span className="font-medium">{relatedGoal.title}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingPlan ? '週間計画を編集' : '新しい週間計画を作成'}
              </h2>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weekStart" className="block text-sm font-semibold text-gray-700 mb-2">
                    週の開始日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="weekStart"
                    value={formData.weekStart}
                    onChange={(e) => setFormData({ ...formData, weekStart: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="weekEnd" className="block text-sm font-semibold text-gray-700 mb-2">
                    週の終了日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="weekEnd"
                    value={formData.weekEnd}
                    onChange={(e) => setFormData({ ...formData, weekEnd: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="theme" className="block text-sm font-semibold text-gray-700 mb-2">
                  週のテーマ
                </label>
                <input
                  type="text"
                  id="theme"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="例：生産性向上の週、学習集中週間"
                />
              </div>

              <div>
                <label htmlFor="focus" className="block text-sm font-semibold text-gray-700 mb-2">
                  今週の重点事項
                </label>
                <textarea
                  id="focus"
                  value={formData.focus}
                  onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="この週で特に力を入れることは何ですか？"
                />
              </div>

              <div>
                <label htmlFor="monthGoalId" className="block text-sm font-semibold text-gray-700 mb-2">
                  関連する月間目標
                </label>
                <select
                  id="monthGoalId"
                  value={formData.monthGoalId}
                  onChange={(e) => setFormData({ ...formData, monthGoalId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">選択してください</option>
                  {monthlyGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
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
                  disabled={saving || !formData.weekStart || !formData.weekEnd}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? '保存中...' : editingPlan ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
