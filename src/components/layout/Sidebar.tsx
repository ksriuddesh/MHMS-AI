import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Heart, 
  FileText, 
  Users, 
  MessageCircle, 
  User, 
  AlertTriangle,
  X,
  Shield,
  Settings,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, id: 'dashboard' },
  { name: 'Mood Tracker', href: '/mood', icon: Heart, id: 'mood' },
  { name: 'Assessments', href: '/assessments', icon: FileText, id: 'assessments' },
  { name: 'Find Providers', href: '/providers', icon: Users, id: 'providers' },
  { name: 'AI Therapy', href: '/therapy', icon: MessageCircle, id: 'therapy' },
  { name: 'Patient Profile', href: '/profile', icon: User, id: 'profile' },
  { name: 'Admin Panel', href: '/admin', icon: BarChart3, id: 'admin' },
  { name: 'MHMS', href: '/mhms', icon: Shield, id: 'mhms' },
];

export default function Sidebar({ isOpen, onClose, currentPage, onPageChange }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-gray-900/50 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-72 transform bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-gray-100">MindWell</span>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {user && navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => {
                  onPageChange(item.id);
                  onClose();
                }}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive(item.href)
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-r-2 border-indigo-600'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'}`} />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3">
            <Link to="/settings" onClick={onClose} className="flex items-center space-x-3 group">
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Settings className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:underline">Settings</p>
                <p className="text-gray-500 dark:text-gray-400">Privacy & Security</p>
              </div>
            </Link>
            <Link to="/about" onClick={onClose} className="flex items-center space-x-3 group">
              <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items=center justify-center">
                <Shield className="h-4 w-4 text-gray-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:underline">About</p>
                <p className="text-gray-500 dark:text-gray-400">App info & version</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}