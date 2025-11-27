import React from 'react';
import { 
  TrendingUp, 
  Heart, 
  Brain, 
  Shield, 
  Award,
  Calendar,
  Activity,
  Target
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import MetricCard from '../components/dashboard/MetricCard';
import MoodChart from '../components/dashboard/MoodChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import WellnessGoals from '../components/dashboard/WellnessGoals';
import QuickActions from '../components/dashboard/QuickActions';

export default function Dashboard() {
  const { dailyScore, weeklyTrend, moodEntries, assessments } = useData();
  const { user } = useAuth();

  const metrics = [
    {
      title: 'Daily Wellness Score',
      value: dailyScore.toString(),
      change: `+${weeklyTrend - dailyScore}%`,
      changeType: weeklyTrend > dailyScore ? 'increase' : 'decrease' as const,
      icon: Heart,
      color: 'blue'
    },
    {
      title: 'Weekly Trend',
      value: weeklyTrend.toString(),
      change: '+12%',
      changeType: 'increase' as const,
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Mood Stability',
      value: '8.2',
      change: '+5%',
      changeType: 'increase' as const,
      icon: Activity,
      color: 'purple'
    },
    {
      title: 'Goal Progress',
      value: '85%',
      change: '+15%',
      changeType: 'increase' as const,
      icon: Target,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Good morning, {user?.name || 'Friend'}!</h1>
            <p className="text-indigo-100 mb-4">
              Your wellness journey continues. Today looks promising with a score of {dailyScore}/100.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                January 15, 2024
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Data Protected
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Brain className="h-12 w-12 text-white mb-2" />
              <p className="text-sm text-indigo-100">AI Insights Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            changeType={metric.changeType}
            icon={metric.icon}
            color={metric.color}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <MoodChart entries={moodEntries} />
          <RecentActivity />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <QuickActions />
          <WellnessGoals />
          
          {/* Achievement Badge */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Latest Achievement</h3>
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">7-Day Streak</p>
                <p className="text-sm text-gray-500">Consistent mood tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}