import React from 'react';
import { Sun, Moon, Bell, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();

  const privacy = user?.preferences.privacy ?? 'limited';
  const notifications = user?.preferences.notifications ?? true;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Switch between light and dark themes</p>
          </div>
          <button
            onClick={toggleTheme}
            className="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {theme === 'light' ? (
              <>
                <Sun className="h-4 w-4 mr-2" /> Light
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 mr-2" /> Dark
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Notifications</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mr-3">
              <Bell className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Enable reminders</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get prompts to track mood and complete goals</p>
            </div>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={!!notifications}
              onChange={(e) => updateUser({
                preferences: {
                  ...(user?.preferences ?? { theme: 'light', notifications: true, privacy: 'limited' }),
                  notifications: e.target.checked
                }
              })}
            />
            <span className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full relative transition-colors">
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white dark:bg-gray-200 transition-transform ${notifications ? 'translate-x-4' : ''}`}></span>
            </span>
          </label>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Privacy</h2>
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center mr-3">
            <Shield className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-gray-700 dark:text-gray-300">Control how your data is shared in app insights</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['private','limited','open'] as const).map(option => (
            <button
              key={option}
              onClick={() => updateUser({
                preferences: {
                  ...(user?.preferences ?? { theme: 'light', notifications: true, privacy: 'limited' }),
                  privacy: option
                }
              })}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors
                ${privacy === option
                  ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              {option === 'private' && 'Private'}
              {option === 'limited' && 'Limited'}
              {option === 'open' && 'Open'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


