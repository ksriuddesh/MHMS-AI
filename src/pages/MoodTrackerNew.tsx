import React, { useState, useMemo } from 'react';
import { 
  Smile, Meh, Frown, Sparkles, Activity, Brain, Plus,
  Download, Calendar, TrendingUp, Heart, CheckCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const API_BASE = (import.meta as any)?.env?.VITE_API_URL || '';

// Emoji mood options with intensity
const moodEmojis = [
  { emoji: '😊', label: 'Happy', value: 9, color: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' },
  { emoji: '😌', label: 'Content', value: 7, color: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200' },
  { emoji: '😐', label: 'Neutral', value: 5, color: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' },
  { emoji: '😔', label: 'Sad', value: 3, color: 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200' },
  { emoji: '😰', label: 'Stressed', value: 2, color: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200' },
  { emoji: '😄', label: 'Excited', value: 10, color: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200' },
];

const timeOfDay = ['Morning', 'Afternoon', 'Evening', 'Night'];

const activityTags = [
  { icon: '💼', label: 'Work', value: 'work' },
  { icon: '🏋️', label: 'Gym', value: 'exercise' },
  { icon: '😴', label: 'Rest', value: 'rest' },
  { icon: '👥', label: 'Social', value: 'social' },
  { icon: '🍽️', label: 'Diet', value: 'diet' },
  { icon: '🎮', label: 'Leisure', value: 'leisure' },
  { icon: '👨‍👩‍👧', label: 'Family', value: 'family' },
  { icon: '🌤️', label: 'Weather', value: 'weather' },
  { icon: '💰', label: 'Finances', value: 'finances' },
  { icon: '🏥', label: 'Health', value: 'health' },
];

export default function MoodTrackerNew() {
  const { addMoodEntry, moodEntries } = useData();
  
  const [selectedMood, setSelectedMood] = useState(moodEmojis[0]);
  const [intensity, setIntensity] = useState(7);
  const [selectedTime, setSelectedTime] = useState('Morning');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [journalEntry, setJournalEntry] = useState('');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleActivity = (value: string) => {
    setSelectedActivities(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const generateAIInsight = async () => {
    setIsGeneratingInsight(true);
    try {
      const recentEntries = moodEntries.slice(0, 7);
      const prompt = `Analyze this mood data and provide a brief, supportive insight (2-3 sentences):
Recent mood: ${selectedMood.label} (${intensity}/10)
Activities: ${selectedActivities.join(', ') || 'none'}
Recent history: ${recentEntries.map(e => `${e.mood}/10`).join(', ')}

Provide encouraging, actionable wellness advice.`;

      const resp = await fetch(`${API_BASE}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (resp.ok) {
        const data = await resp.json();
        setAiInsight(data.text || 'Keep tracking your mood to discover patterns and insights.');
      } else {
        setAiInsight('Your mood patterns show you\'re actively engaged in self-care. Continue tracking to identify what works best for you.');
      }
    } catch {
      setAiInsight('Tracking your mood is a powerful step toward wellness. Keep it up!');
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const entry = {
      date: new Date().toISOString().split('T')[0],
      mood: intensity,
      energy: intensity,
      anxiety: 5,
      sleep: 7,
      notes: journalEntry,
      factors: selectedActivities
    };

    addMoodEntry(entry);
    
    if (!aiInsight) {
      await generateAIInsight();
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setJournalEntry('');
      setSelectedActivities([]);
    }, 3000);
  };

  const weeklyAverage = useMemo(() => {
    const recent = moodEntries.slice(0, 7);
    if (!recent.length) return 0;
    return Math.round(recent.reduce((sum, e) => sum + e.mood, 0) / recent.length);
  }, [moodEntries]);

  const moodStreak = useMemo(() => {
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const dates = moodEntries.map(e => e.date).sort().reverse();
    
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const expectedDate = expected.toISOString().split('T')[0];
      if (dates[i] === expectedDate) streak++;
      else break;
    }
    return streak;
  }, [moodEntries]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-8 text-white shadow-lg">
        <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-10 w-10" />
            <h1 className="text-4xl font-extrabold tracking-tight">How are you feeling today?</h1>
          </div>
          <p className="text-purple-100 text-lg">Track your mood and discover patterns that support your wellbeing</p>
          <div className="mt-4 flex gap-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">7-day average: {weeklyAverage}/10</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <span className="text-sm">{moodStreak} day streak 🔥</span>
            </div>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-200 font-medium">Mood entry saved! Keep up the great work! 🎉</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mood Selector */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Smile className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Select Your Mood</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {moodEmojis.map((mood) => (
              <button
                key={mood.label}
                type="button"
                onClick={() => setSelectedMood(mood)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedMood.label === mood.label
                    ? mood.color + ' border-current scale-105 shadow-md'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-4xl mb-2">{mood.emoji}</div>
                <div className="text-sm font-medium">{mood.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Intensity Slider */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Intensity Level</h2>
            </div>
            <div className="px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-lg">
              {intensity}/10
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #fca5a5 0%, #fde047 50%, #86efac 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>Low</span>
            <span>Moderate</span>
            <span>High</span>
          </div>
        </div>

        {/* Time of Day */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Time of Day</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {timeOfDay.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`p-3 rounded-lg border-2 font-medium transition-all duration-200 ${
                  selectedTime === time
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Tags */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">What's Affecting Your Mood?</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {activityTags.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleActivity(tag.value)}
                className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedActivities.includes(tag.value)
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 scale-105'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{tag.icon}</span>
                <span className="text-sm">{tag.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Journal Entry */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Journal Entry (Optional)</h2>
          </div>
          <textarea
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            placeholder="How are you feeling? What's on your mind today?"
            className="w-full h-32 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            maxLength={500}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
            {journalEntry.length}/500 characters
          </div>
        </div>

        {/* AI Insights */}
        {aiInsight && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100">AI Wellness Insight</h2>
            </div>
            <p className="text-purple-800 dark:text-purple-200">{aiInsight}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Save Mood Entry
          </button>
          <button
            type="button"
            onClick={generateAIInsight}
            disabled={isGeneratingInsight}
            className="px-6 py-4 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
          >
            <Sparkles className={`h-5 w-5 ${isGeneratingInsight ? 'animate-spin' : ''}`} />
            {isGeneratingInsight ? 'Generating...' : 'Get AI Insight'}
          </button>
        </div>
      </form>

      {/* Recent Entries */}
      {moodEntries.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Entries</h2>
            <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export Data
            </button>
          </div>
          <div className="space-y-3">
            {moodEntries.slice(0, 5).map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{moodEmojis.find(m => m.value === entry.mood)?.emoji || '😊'}</div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{new Date(entry.date).toLocaleDateString()}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{entry.factors.join(', ') || 'No activities'}</div>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                  {entry.mood}/10
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
