import React from 'react';
import { Target, CheckCircle, Circle, TrendingUp } from 'lucide-react';

const goals = [
  {
    id: 1,
    title: 'Daily Mood Tracking',
    progress: 85,
    target: 100,
    completed: true,
    streak: 7
  },
  {
    id: 2,
    title: 'Weekly Therapy Sessions',
    progress: 66,
    target: 100,
    completed: false,
    streak: 3
  },
  {
    id: 3,
    title: 'Mindfulness Practice',
    progress: 42,
    target: 100,
    completed: false,
    streak: 4
  },
  {
    id: 4,
    title: 'Sleep Quality',
    progress: 91,
    target: 100,
    completed: true,
    streak: 12
  }
];

export default function WellnessGoals() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Target className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Wellness Goals</h3>
        </div>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          Edit goals
        </button>
      </div>
      
      <div className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {goal.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-900">{goal.title}</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">{goal.streak} day streak</span>
              </div>
            </div>
            
            <div className="ml-6">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{goal.progress}%</span>
                <span>{goal.target}% target</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    goal.completed ? 'bg-green-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}