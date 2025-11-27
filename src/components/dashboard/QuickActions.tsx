import React from 'react';
import { Plus, Brain, Heart, Calendar, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const actions = [
  {
    title: 'Log Mood',
    description: 'Quick mood entry',
    icon: Heart,
    href: '/mood',
    color: 'bg-pink-50 hover:bg-pink-100 text-pink-600'
  },
  {
    title: 'Take Assessment',
    description: 'PHQ-9, GAD-7, PSS-10',
    icon: Brain,
    href: '/assessments',
    color: 'bg-blue-50 hover:bg-blue-100 text-blue-600'
  },
  {
    title: 'Book Appointment',
    description: 'Find mental health provider',
    icon: Calendar,
    href: '/providers',
    color: 'bg-green-50 hover:bg-green-100 text-green-600'
  },
  {
    title: 'AI Therapy',
    description: 'Chat with AI therapist',
    icon: MessageCircle,
    href: '/therapy',
    color: 'bg-purple-50 hover:bg-purple-100 text-purple-600'
  }
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Plus className="h-5 w-5 text-indigo-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.href}
            className={`p-4 rounded-lg border border-gray-200 transition-all duration-200 ${action.color}`}
          >
            <action.icon className="h-6 w-6 mb-2" />
            <h4 className="font-medium text-sm mb-1">{action.title}</h4>
            <p className="text-xs opacity-80">{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}