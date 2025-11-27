import React, { useState } from 'react';
import { Menu, Bell, Search, Sun, Moon, LogOut, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { moodEntries, assessments, providers } = useData();
  const [query, setQuery] = React.useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = React.useRef<HTMLDivElement>(null);
  
  // Close notifications when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Sample notifications - in a real app, these would come from a backend
  const [notifications] = useState([
    {
      id: 1,
      type: 'info',
      title: 'Daily Mood Check-in',
      message: 'Time for your daily mood check-in',
      time: '2 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'success',
      title: 'Assessment Completed',
      message: 'Your PHQ-9 assessment has been completed',
      time: '1 hour ago',
      read: true
    },
    {
      id: 3,
      type: 'warning',
      title: 'Mood Trend Alert',
      message: 'Your mood has been consistently low for 3 days',
      time: '3 hours ago',
      read: false
    }
  ]);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    // simple router shortcuts
    const shortcuts: Record<string, string> = {
      dashboard: '/', home: '/',
      mood: '/mood', moods: '/mood',
      assess: '/assessments', assessments: '/assessments',
      providers: '/providers', therapist: '/providers', therapy: '/therapy',
      profile: '/profile', settings: '/settings', data: '/data', mhms: '/mhms', about: '/about'
    };
    if (shortcuts[q]) {
      navigate(shortcuts[q]);
      return;
    }
    // otherwise try providers first
    const provider = providers.find(p => p.name.toLowerCase().includes(q) || p.specialty.toLowerCase().includes(q));
    if (provider) {
      navigate('/providers');
      return;
    }
    // search assessments by type
    const assessment = assessments.find(a => a.type.toLowerCase().includes(q));
    if (assessment) {
      navigate('/assessments');
      return;
    }
    // search mood notes
    const mood = moodEntries.find(m => (m.notes || '').toLowerCase().includes(q));
    if (mood) {
      navigate('/mood');
      return;
    }
    // default to dashboard
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Center search */}
        <div className="flex-1 flex items-center justify-center">
          <form onSubmit={onSearch} className="w-full max-w-xl hidden md:block">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search providers, assessments, mood notes, or pages..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </form>
        </div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Theme toggle */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <Moon className="h-6 w-6" />
            ) : (
              <Sun className="h-6 w-6" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {notification.type === 'success' && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            {notification.type === 'warning' && (
                              <AlertCircle className="h-5 w-5 text-yellow-500" />
                            )}
                            {notification.type === 'info' && (
                              <Info className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-full text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

          {/* Profile */}
          <div className="relative">
            <div className="flex items-center gap-x-2">
              <img
                className="h-8 w-8 rounded-full bg-gray-50"
                src={user?.avatar}
                alt={user?.name}
              />
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100">
                  {user?.name}
                </span>
              </span>
              {user && (
                <button
                  onClick={logout}
                  className="ml-3 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}