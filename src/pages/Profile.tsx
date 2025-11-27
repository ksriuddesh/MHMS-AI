import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Moon, 
  Sun, 
  Download, 
  Upload,
  Settings,
  Lock,
  Eye,
  EyeOff,
  Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [showDataExport, setShowDataExport] = useState(false);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'privacy', name: 'Privacy & Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell }
  ];

  const privacyLevels = [
    {
      id: 'private',
      name: 'Private',
      description: 'Data stays completely private to you'
    },
    {
      id: 'limited',
      name: 'Limited Sharing',
      description: 'Share anonymized data for research'
    },
    {
      id: 'open',
      name: 'Open',
      description: 'Share with healthcare providers and family'
    }
  ];

  const ProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-24 h-24 rounded-full object-cover"
            />
            <button className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors duration-200">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>Joined January 2024</span>
              <span>•</span>
              <span>15 mood entries this month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              defaultValue={user?.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              defaultValue={user?.email}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Eastern Time (ET)</option>
              <option>Central Time (CT)</option>
              <option>Mountain Time (MT)</option>
              <option>Pacific Time (PT)</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button className="bg-indigo-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200">
            Save Changes
          </button>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contacts</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Dr. Sarah Mitchell</p>
              <p className="text-sm text-gray-600">Primary Therapist • (555) 123-4567</p>
            </div>
            <button className="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Jamie Johnson</p>
              <p className="text-sm text-gray-600">Emergency Contact • (555) 987-6543</p>
            </div>
            <button className="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
          </div>
          
          <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors duration-200">
            + Add Emergency Contact
          </button>
        </div>
      </div>
    </div>
  );

  const PrivacyTab = () => (
    <div className="space-y-6">
      {/* Privacy Level */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-indigo-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Privacy Level</h3>
        </div>
        
        <div className="space-y-3">
          {privacyLevels.map((level) => (
            <label
              key={level.id}
              className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            >
              <input
                type="radio"
                name="privacy"
                value={level.id}
                defaultChecked={user?.preferences.privacy === level.id}
                className="mt-1 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="ml-3">
                <p className="font-medium text-gray-900">{level.name}</p>
                <p className="text-sm text-gray-600">{level.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Lock className="h-6 w-6 text-indigo-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
          </div>
          <button className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200">
            Enable 2FA
          </button>
        </div>
      </div>

      {/* Data Encryption */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-green-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Encryption</h3>
            <p className="text-gray-600 mb-4">
              Your data is protected with end-to-end encryption and meets HIPAA compliance standards.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>256-bit AES encryption enabled</span>
              </div>
              <div className="flex items-center text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>HIPAA compliant data storage</span>
              </div>
              <div className="flex items-center text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Regular security audits</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const NotificationsTab = () => (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Bell className="h-6 w-6 text-indigo-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Daily Mood Reminders</p>
              <p className="text-sm text-gray-600">Get reminded to log your mood</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Assessment Reminders</p>
              <p className="text-sm text-gray-600">Weekly reminders for mental health assessments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Appointment Reminders</p>
              <p className="text-sm text-gray-600">Notifications for upcoming appointments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Crisis Alerts</p>
              <p className="text-sm text-gray-600">Important safety and crisis notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {theme === 'light' ? (
              <Sun className="h-6 w-6 text-yellow-500 mr-3" />
            ) : (
              <Moon className="h-6 w-6 text-indigo-600 mr-3" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Theme Preference</h3>
              <p className="text-sm text-gray-600">Choose your preferred theme</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-4 w-4 mr-2" />
                Switch to Dark
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 mr-2" />
                Switch to Light
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const DataTab = () => (
    <div className="space-y-6">
      {/* Data Export */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Download className="h-6 w-6 text-indigo-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Export Your Data</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Download all your mental health data including mood entries, assessments, and progress reports.
        </p>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" className="text-indigo-600 focus:ring-indigo-500 rounded" defaultChecked />
            <span className="ml-2 text-sm text-gray-700">Mood tracking data</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="text-indigo-600 focus:ring-indigo-500 rounded" defaultChecked />
            <span className="ml-2 text-sm text-gray-700">Assessment results</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="text-indigo-600 focus:ring-indigo-500 rounded" defaultChecked />
            <span className="ml-2 text-sm text-gray-700">AI therapy conversations</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="text-indigo-600 focus:ring-indigo-500 rounded" />
            <span className="ml-2 text-sm text-gray-700">Healthcare provider information</span>
          </label>
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => setShowDataExport(true)}
            className="bg-indigo-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Generate Export
          </button>
          <button className="border border-gray-300 text-gray-700 font-medium px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            Email Export Link
          </button>
        </div>
      </div>

      {/* Data Import */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Upload className="h-6 w-6 text-indigo-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Import Data</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Import mental health data from other apps or healthcare providers.
        </p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
          <p className="text-xs text-gray-500">Supports CSV, JSON, and PDF formats</p>
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Retention Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Automatically delete data older than:
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Never</option>
              <option>1 year</option>
              <option>2 years</option>
              <option>5 years</option>
            </select>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Deleting data will permanently remove it from your account and cannot be undone.
              Consider exporting your data before enabling automatic deletion.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Delete Account</h3>
        <p className="text-red-700 text-sm mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button className="bg-red-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
          Delete My Account
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-600">Manage your profile, privacy, and data preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'privacy' && <PrivacyTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {/* Data tab moved to separate page */}
        </div>
      </div>

      {/* Data Export Modal */}
      {showDataExport && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Export Ready</h3>
            <p className="text-gray-600 mb-4">
              Your data export has been generated and is ready for download.
            </p>
            <div className="flex space-x-3">
              <button className="flex-1 bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200">
                Download Now
              </button>
              <button
                onClick={() => setShowDataExport(false)}
                className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}