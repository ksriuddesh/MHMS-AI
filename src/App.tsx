import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import MoodTracker from './pages/MoodTrackerNew';
import Assessments from './pages/Assessments';
import ProviderDirectory from './pages/ProviderDirectory';
import Therapy from './pages/Therapy';
import PatientProfile from './pages/PatientProfile';
import DataManagement from './pages/DataManagement';
import Settings from './pages/Settings';
// Crisis removed
import MHMS from './pages/MHMS.tsx';
import About from './pages/About.tsx';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import ProfileCompletionModal from './components/ProfileCompletionModal';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const { user, isLoading } = useAuth();
  const { isProfileComplete } = useData();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // If already authenticated, redirect away from auth pages
  React.useEffect(() => {
    if (!isLoading && user && isAuthPage) {
      const state = (location as any).state as { from?: string } | undefined;
      navigate(state?.from || '/', { replace: true });
    }
  }, [user, isLoading, isAuthPage, navigate]);

  // After-login welcome modal and profile check
  React.useEffect(() => {
    if (!isLoading && user && !isAuthPage) {
      const justLoggedIn = sessionStorage.getItem('justLoggedIn');
      const profileSkipped = sessionStorage.getItem('profileSkipped');
      
      if (justLoggedIn === '1') {
        // Check if profile is complete
        if (!isProfileComplete() && profileSkipped !== '1') {
          // Show profile completion modal instead of welcome
          setShowProfileModal(true);
        } else {
          // Show welcome modal
          setShowWelcome(true);
        }
        try { sessionStorage.setItem('justLoggedIn', '0'); } catch {}
      }
    }
  }, [user, isLoading, isAuthPage, isProfileComplete]);

  if (isAuthPage) {
    return (
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      <div className="lg:pl-72">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {showProfileModal && (
            <ProfileCompletionModal onClose={() => setShowProfileModal(false)} />
          )}
          {showWelcome && (
            <WelcomeModal onClose={() => { setShowWelcome(false); sessionStorage.removeItem('justLoggedIn'); }} />
          )}
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mood"
              element={
                <ProtectedRoute>
                  <MoodTracker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments"
              element={
                <ProtectedRoute>
                  <Assessments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/providers"
              element={
                <ProtectedRoute>
                  <ProviderDirectory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/therapy"
              element={
                <ProtectedRoute>
                  <Therapy />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <PatientProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-profile"
              element={
                <ProtectedRoute>
                  <PatientProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/data"
              element={
                <ProtectedRoute>
                  <DataManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mhms"
              element={
                <ProtectedRoute>
                  <MHMS />
                </ProtectedRoute>
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <AppShell />
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

// Inline welcome modal component
function WelcomeModal({ onClose }: { onClose: () => void }) {
  const data = useData();
  const [selected, setSelected] = React.useState<number | null>(null);

  const submit = () => {
    if (selected == null) return;
    const today = new Date().toISOString().split('T')[0];
    data.addMoodEntry({
      date: today,
      mood: selected,
      energy: 5,
      anxiety: 5,
      sleep: 5,
      notes: 'Quick check-in from welcome modal',
      factors: []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Thanks for logging in!</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">How's your mood today?</p>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Array.from({ length: 10 }).map((_, i) => {
            const value = i + 1;
            const active = selected === value;
            return (
              <button
                key={value}
                onClick={() => setSelected(value)}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors
                  ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                {value}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Skip</button>
          <button onClick={submit} disabled={selected == null} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
}