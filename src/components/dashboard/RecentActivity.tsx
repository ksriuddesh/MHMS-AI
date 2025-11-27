import React from 'react';
import { FileText, Heart, Users, MessageCircle, Calendar, Clock } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'mood',
    title: 'Mood entry logged',
    description: 'Feeling optimistic today with high energy levels',
    time: '2 hours ago',
    icon: Heart,
    color: 'bg-pink-50 text-pink-600'
  },
  {
    id: 2,
    type: 'assessment',
    title: 'PHQ-9 Assessment completed',
    description: 'Score: 8/27 (Mild) - Improvement from last assessment',
    time: '1 day ago',
    icon: FileText,
    color: 'bg-blue-50 text-blue-600'
  },
  {
    id: 3,
    type: 'appointment',
    title: 'Appointment scheduled',
    description: 'Dr. Sarah Mitchell - January 20, 2:00 PM',
    time: '2 days ago',
    icon: Calendar,
    color: 'bg-green-50 text-green-600'
  },
  {
    id: 4,
    type: 'therapy',
    title: 'AI Therapy session',
    description: 'Completed mindfulness exercise and breathing techniques',
    time: '3 days ago',
    icon: MessageCircle,
    color: 'bg-purple-50 text-purple-600'
  }
];

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500">Your latest wellness interactions</p>
        </div>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          View all
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className={`p-2 rounded-lg ${activity.color}`}>
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
              <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
              <div className="flex items-center mt-2">
                <Clock className="h-3 w-3 text-gray-400 mr-1" />
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}