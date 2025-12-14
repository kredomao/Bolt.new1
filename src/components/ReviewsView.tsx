import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, WeeklyReview, DailyReview, WeeklyPlan } from '../lib/supabase';
import { Plus, Trash2, Edit2, X, Calendar } from 'lucide-react';

type ReviewType = 'weekly' | 'daily';

export default function ReviewsView() {
  const { user } = useAuth();
  const [reviewType, setReviewType] = useState<ReviewType>('weekly');
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [dailyReviews, setDailyReviews] = useState<DailyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<WeeklyReview | DailyReview | null>(null);
  const [formData, setFormData] = useState({
    weeklyPlanId: '',
    reviewDate: new Date().toISOString().split('T')[0],
    whatWentWell: '',
    whatCouldImprove: '',
    wins: '',
    learnings: '',
    gratitude: '',
    improvements: '',
    tomorrowFocus: '',
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
      const [plansRes, weeklyRes, dailyRes] = await Promise.all([
        supabase.from('weekly_plans').select('*').eq('user_id', user?.id).order('week_start_date', { ascending: false }),
        supabase.from('weekly_reviews').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('daily_reviews').select('*').eq('user_id', user?.id).order('review_date', { ascending: false }),
      ]);

      setWeeklyPlans(plansRes.data || []);
      setWeeklyReviews(weeklyRes.data || []);
      setDailyReviews(dailyRes.data || []);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (reviewType === 'weekly') {
        if (!formData.weeklyPlanId) {
          alert('週間計画を選択してください');
          setSaving(false);
          return;
        }

        if (editingReview && 'weekly_plan_id' in editingReview) {
          const { error } = await supabase
            .from('weekly_reviews')
            .update({
              what_went_well: formData.whatWentWell.trim(),
              what_could_improve: formData.whatCouldImprove.trim(),
              wins: formData.wins.trim(),
              learnings: formData.learnings.trim(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', editingReview.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from('weekly_reviews').insert([
            {
              user_id: user?.id,
              weekly_plan_id: formData.weeklyPlanId,
              what_went_well: formData.whatWentWell.trim(),
              what_could_improve: formData.whatCouldImprove.trim(),
              wins: formData.wins.trim(),
              learnings: formData.learnings.trim(),
            },
          ]);

          if (error) throw error;
        }
      } else {
        if (editingReview && 'review_date' in editingReview) {
          const { error } = await supabase
            .from('daily_reviews')
            .update({
              gratitude: formData.gratitude.trim(),
              wins: formData.wins.trim(),
              improvements: formData.improvements.trim(),
              tomorrow_focus: formData.tomorrowFocus.trim(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', editingReview.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from('daily_reviews').insert([
            {
              user_id: user?.id,
              review_date: formData.reviewDate,
              gratitude: formData.gratitude.trim(),
              wins: formData.wins.trim(),
              improvements: formData.improvements.trim(),
              tomorrow_focus: formData.tomorrowFocus.trim(),
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

  async function deleteReview(id: string, type: ReviewType) {
    if (!confirm('このレビューを削除しますか？')) return;

    try {
      const table = type === 'weekly' ? 'weekly_reviews' : 'daily_reviews';
      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) throw error;
      fetchAllData();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  }

  function handleEdit(review: WeeklyReview | DailyReview, type: ReviewType) {
    setEditingReview(review);
    setReviewType(type);

    if (type === 'weekly' && 'weekly_plan_id' in review) {
      setFormData({
        weeklyPlanId: review.weekly_plan_id,
        reviewDate: '',
        whatWentWell: review.what_went_well,
        whatCouldImprove: review.what_could_improve,
        wins: review.wins,
        learnings: review.learnings,
        gratitude: '',
        improvements: '',
        tomorrowFocus: '',
      });
    } else if (type === 'daily' && 'review_date' in review) {
      setFormData({
        weeklyPlanId: '',
        reviewDate: review.review_date,
        whatWentWell: '',
        whatCouldImprove: '',
        wins: review.wins,
        learnings: '',
        gratitude: review.gratitude,
        improvements: review.improvements,
        tomorrowFocus: review.tomorrow_focus,
      });
    }

    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditingReview(null);
    setFormData({
      weeklyPlanId: '',
      reviewDate: new Date().toISOString().split('T')[0],
      whatWentWell: '',
      whatCouldImprove: '',
      wins: '',
      learnings: '',
      gratitude: '',
      improvements: '',
      tomorrowFocus: '',
    });
  }

  if (loading) {
    return <div className="text-gray-600">読み込み中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">レビュー</h1>
        <p className="text-gray-600">週間と日次の振り返りで、成長を記録します</p>
      </div>

      {/* Review Type Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setReviewType('weekly')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            reviewType === 'weekly'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          週間レビュー
        </button>
        <button
          onClick={() => setReviewType('daily')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            reviewType === 'daily'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          日次レビュー
        </button>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-xl"
      >
        <Plus size={24} />
        新しい{reviewType === 'weekly' ? '週間' : '日次'}レビューを追加
      </button>

      {reviewType === 'weekly' ? (
        // Weekly Reviews
        weeklyReviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">まだ週間レビューが登録されていません。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {weeklyReviews.map((review) => {
              const relatedPlan = weeklyPlans.find((p) => p.id === review.weekly_plan_id);
              return (
                <div key={review.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      {relatedPlan && (
                        <p className="text-sm text-gray-600 mb-2">
                          {new Date(relatedPlan.week_start_date).toLocaleDateString('ja-JP')} 〜{' '}
                          {new Date(relatedPlan.week_end_date).toLocaleDateString('ja-JP')}
                        </p>
                      )}
                      <h3 className="text-xl font-semibold text-gray-800">週間レビュー</h3>
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                      <button
                        onClick={() => handleEdit(review, 'weekly')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => deleteReview(review.id, 'weekly')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {review.what_went_well && (
                      <div>
                        <h4 className="font-semibold text-green-700 mb-1">✓ うまくいったこと</h4>
                        <p className="text-gray-700">{review.what_went_well}</p>
                      </div>
                    )}
                    {review.what_could_improve && (
                      <div>
                        <h4 className="font-semibold text-orange-700 mb-1">→ 改善できること</h4>
                        <p className="text-gray-700">{review.what_could_improve}</p>
                      </div>
                    )}
                    {review.wins && (
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-1">🎯 達成したこと</h4>
                        <p className="text-gray-700">{review.wins}</p>
                      </div>
                    )}
                    {review.learnings && (
                      <div>
                        <h4 className="font-semibold text-purple-700 mb-1">💡 学んだこと</h4>
                        <p className="text-gray-700">{review.learnings}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // Daily Reviews
        dailyReviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">まだ日次レビューが登録されていません。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dailyReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      {new Date(review.review_date).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>
                  </div>
                  <div className="flex-shrink-0 flex gap-2">
                    <button
                      onClick={() => handleEdit(review, 'daily')}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => deleteReview(review.id, 'daily')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {review.gratitude && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-1">🙏 感謝したいこと</h4>
                      <p className="text-gray-700">{review.gratitude}</p>
                    </div>
                  )}
                  {review.wins && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-1">✨ 達成したこと</h4>
                      <p className="text-gray-700">{review.wins}</p>
                    </div>
                  )}
                  {review.improvements && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-1">🔧 改善できること</h4>
                      <p className="text-gray-700">{review.improvements}</p>
                    </div>
                  )}
                  {review.tomorrow_focus && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-1">🎯 明日の重点</h4>
                      <p className="text-gray-700">{review.tomorrow_focus}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingReview ? `${reviewType === 'weekly' ? '週間' : '日次'}レビューを編集` : `新しい${reviewType === 'weekly' ? '週間' : '日次'}レビューを追加`}
              </h2>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {reviewType === 'weekly' ? (
                <>
                  <div>
                    <label htmlFor="weeklyPlanId" className="block text-sm font-semibold text-gray-700 mb-2">
                      対象の週間計画 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="weeklyPlanId"
                      value={formData.weeklyPlanId}
                      onChange={(e) => setFormData({ ...formData, weeklyPlanId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
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

                  <div>
                    <label htmlFor="whatWentWell" className="block text-sm font-semibold text-gray-700 mb-2">
                      うまくいったこと
                    </label>
                    <textarea
                      id="whatWentWell"
                      value={formData.whatWentWell}
                      onChange={(e) => setFormData({ ...formData, whatWentWell: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="この週でうまくいったことを記入してください..."
                    />
                  </div>

                  <div>
                    <label htmlFor="whatCouldImprove" className="block text-sm font-semibold text-gray-700 mb-2">
                      改善できること
                    </label>
                    <textarea
                      id="whatCouldImprove"
                      value={formData.whatCouldImprove}
                      onChange={(e) => setFormData({ ...formData, whatCouldImprove: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="来週に向けて改善するべきことを記入してください..."
                    />
                  </div>

                  <div>
                    <label htmlFor="wins" className="block text-sm font-semibold text-gray-700 mb-2">
                      達成したこと
                    </label>
                    <textarea
                      id="wins"
                      value={formData.wins}
                      onChange={(e) => setFormData({ ...formData, wins: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="実現できた目標や成果を記入してください..."
                    />
                  </div>

                  <div>
                    <label htmlFor="learnings" className="block text-sm font-semibold text-gray-700 mb-2">
                      学んだこと
                    </label>
                    <textarea
                      id="learnings"
                      value={formData.learnings}
                      onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="この週で学んだことを記入してください..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="reviewDate" className="block text-sm font-semibold text-gray-700 mb-2">
                      レビュー日付 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="reviewDate"
                      value={formData.reviewDate}
                      onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="gratitude" className="block text-sm font-semibold text-gray-700 mb-2">
                      感謝したいこと
                    </label>
                    <textarea
                      id="gratitude"
                      value={formData.gratitude}
                      onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="今日感謝したいことを記入してください..."
                    />
                  </div>

                  <div>
                    <label htmlFor="wins" className="block text-sm font-semibold text-gray-700 mb-2">
                      達成したこと
                    </label>
                    <textarea
                      id="wins"
                      value={formData.wins}
                      onChange={(e) => setFormData({ ...formData, wins: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="今日達成したことを記入してください..."
                    />
                  </div>

                  <div>
                    <label htmlFor="improvements" className="block text-sm font-semibold text-gray-700 mb-2">
                      改善できること
                    </label>
                    <textarea
                      id="improvements"
                      value={formData.improvements}
                      onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="明日に向けて改善すべきことを記入してください..."
                    />
                  </div>

                  <div>
                    <label htmlFor="tomorrowFocus" className="block text-sm font-semibold text-gray-700 mb-2">
                      明日の重点
                    </label>
                    <textarea
                      id="tomorrowFocus"
                      value={formData.tomorrowFocus}
                      onChange={(e) => setFormData({ ...formData, tomorrowFocus: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="明日特に重点を置くことを記入してください..."
                    />
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
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? '保存中...' : editingReview ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
