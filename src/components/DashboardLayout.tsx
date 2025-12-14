import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, LogOut, BookOpen, Target, Calendar, CheckCircle, Star, BarChart3 } from 'lucide-react';
import Dashboard from './Dashboard';
import ValuesManager from './ValuesManager';
import GoalsManager from './GoalsManager';
import WeeklyPlanner from './WeeklyPlanner';
import TasksView from './TasksView';
import ReviewsView from './ReviewsView';

interface DashboardLayoutProps {
  currentView: 'dashboard' | 'values' | 'goals' | 'weekly' | 'tasks' | 'reviews';
  setCurrentView: (view: 'dashboard' | 'values' | 'goals' | 'weekly' | 'tasks' | 'reviews') => void;
}

export default function DashboardLayout({ currentView, setCurrentView }: DashboardLayoutProps) {
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: BarChart3 },
    { id: 'values', label: '価値観・人生目標', icon: Star },
    { id: 'goals', label: '目標管理', icon: Target },
    { id: 'weekly', label: '週間計画', icon: Calendar },
    { id: 'tasks', label: 'タスク一覧', icon: CheckCircle },
    { id: 'reviews', label: 'レビュー', icon: BookOpen },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-gray-800">フランクリン手帳</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'block' : 'hidden'
        } lg:block w-full lg:w-64 bg-white border-r border-gray-200 p-6 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto`}>
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center gap-2 mb-8">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg text-gray-800">フランクリン手帳</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 mb-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    currentView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all font-medium"
          >
            <LogOut size={20} />
            <span>ログアウト</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'values' && <ValuesManager />}
          {currentView === 'goals' && <GoalsManager />}
          {currentView === 'weekly' && <WeeklyPlanner />}
          {currentView === 'tasks' && <TasksView />}
          {currentView === 'reviews' && <ReviewsView />}
        </main>
      </div>
    </div>
  );
}
