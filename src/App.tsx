import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './components/DashboardLayout';

function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'values' | 'goals' | 'weekly' | 'tasks' | 'reviews'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <DashboardLayout currentView={currentView} setCurrentView={setCurrentView} />;
}

export default App;
