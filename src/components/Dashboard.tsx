import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Target, CheckCircle, Calendar, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTodos: 0,
    completedTodos: 0,
    tasksToday: 0,
    monthlyGoalProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  async function fetchStats() {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const [todosRes, todayRes] = await Promise.all([
        supabase
          .from('todos')
          .select('*', { count: 'exact' })
          .eq('user_id', user?.id),
        supabase
          .from('todos')
          .select('*', { count: 'exact' })
          .eq('user_id', user?.id)
          .eq('due_date', today),
      ]);

      const completedCount = todosRes.data?.filter((t) => t.completed).length || 0;
      const totalCount = todosRes.count || 0;
      const todayCount = todayRes.count || 0;

      setStats({
        totalTodos: totalCount,
        completedTodos: completedCount,
        tasksToday: todayCount,
        monthlyGoalProgress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      });
    } catch (error) {
      console.error('統計情報の取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'タスク完了率',
      value: `${stats.monthlyGoalProgress}%`,
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'すべてのタスク',
      value: `${stats.completedTodos}/${stats.totalTodos}`,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '今日のタスク',
      value: stats.tasksToday,
      icon: Calendar,
      color: 'bg-orange-100 text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: '人生目標',
      value: '-',
      icon: Target,
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">ダッシュボード</h1>
        <p className="text-gray-600">あなたの人生目標と毎日の進捗を一目で確認</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={`${card.bgColor} rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.color} p-3 rounded-xl`}>
                  <Icon size={24} />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-4">フランクリン・プランナーへようこそ</h2>
        <p className="mb-6 text-blue-100 leading-relaxed">
          このプラットナーは、あなたの人生の価値観から始まり、長期目標、月間・週間計画、毎日のタスクへと段階的に実行していくシステムです。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur">
            <h3 className="font-bold mb-2">4象限マトリクス</h3>
            <p className="text-sm text-blue-100">重要度と緊急度でタスクを分類し、本当に大切なことに集中します</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur">
            <h3 className="font-bold mb-2">週間レビュー</h3>
            <p className="text-sm text-blue-100">毎週の成果を振り返り、次週の計画を立てます</p>
          </div>
        </div>
      </div>
    </div>
  );
}
