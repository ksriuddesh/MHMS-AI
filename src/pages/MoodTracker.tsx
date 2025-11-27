import React, { useState, useMemo } from 'react';
import { 
  Smile, Meh, Frown, Zap, Coffee, Heart, Moon, Sun, Cloud, 
  TrendingUp, Calendar, Sparkles, Activity, Brain, Plus, X,
  Download, ChevronLeft, ChevronRight, BarChart3, LineChart
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const API_BASE = (import.meta as any)?.env?.VITE_API_URL || '';

// Emoji mood options with intensity
const moodEmojis = [
  { emoji: '😊', label: 'Happy', value: 9, color: 'bg-green-100 text-green-700 border-green-300' },
  { emoji: '😌', label: 'Content', value: 7, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { emoji: '😐', label: 'Neutral', value: 5, color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { emoji: '😔', label: 'Sad', value: 3, color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  { emoji: '😰', label: 'Stressed', value: 2, color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { emoji: '😄', label: 'Excited', value: 10, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
];

const timeOfDay = ['Morning', 'Afternoon', 'Evening', 'Night'];

const activityTags = [
  { icon: '💼', label: 'Work', value: 'work' },
  { icon: '🏋️', label: 'Gym', value: 'gym' },
  { icon: '😴', label: 'Rest', value: 'rest' },
  { icon: '👥', label: 'Social', value: 'social' },
  { icon: '🍽️', label: 'Diet', value: 'diet' },
  { icon: '🎮', label: 'Leisure', value: 'leisure' },
  { icon: '👨‍👩‍👧', label: 'Family', value: 'family' },
  { icon: '🌤️', label: 'Weather', value: 'weather' },
  { icon: '💰', label: 'Finances', value: 'finances' },
  { icon: '🏥', label: 'Health', value: 'health' },
];

export default function MoodTracker() {
  const { addMoodEntry, moodEntries } = useData();
  
  // New state for professional mood tracking
  const [selectedMood, setSelectedMood] = useState(moodEmojis[0]);
  const [intensity, setIntensity] = useState(7);
  const [selectedTime, setSelectedTime] = useState('Morning');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [journalEntry, setJournalEntry] = useState('');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [viewMode, setViewMode] = useState<'entry' | 'history' | 'analytics'>('entry');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Legacy state for backward compatibility
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(6);
  const [anxiety, setAnxiety] = useState(4);
  const [sleep, setSleep] = useState(8);

  const handleFactorToggle = (factor: string) => {
    setSelectedFactors(prev => 
      prev.includes(factor) 
        ? prev.filter(f => f !== factor)
        : [...prev, factor]
    );
  };

  async function callGemini(prompt: string) {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, topP: 0.9, topK: 40, maxOutputTokens: 256 } })
    });
    if (!response.ok) return '';
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return String(text);
  }

  async function fetchSuggestion(average: number, lowestKey: 'mood' | 'energy' | 'anxiety' | 'sleep', breakdown: { mood: number; energy: number; anxiety: number; sleep: number }, factors: string[]) {
    try {
      const prompt = `User daily check-in summary:\n- Mood: ${breakdown.mood}/10\n- Energy: ${breakdown.energy}/10\n- Anxiety: ${breakdown.anxiety}/10 (higher = more anxious)\n- Sleep: ${breakdown.sleep}/10\n- Average (normalized): ${average}/10\n- Lowest area: ${lowestKey}\n- Factors: ${factors.join(', ') || 'none'}\n\nProvide one concise, compassionate suggestion (1-2 sentences) tailored to the lowest area. Return plain text only.`;
      const text = await callGemini(prompt);
      return text.trim();
    } catch {
      return null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const entry = {
      date: new Date().toISOString().split('T')[0],
      mood,
      energy,
      anxiety,
      sleep,
      notes,
      factors: selectedFactors
    };

    addMoodEntry(entry);

    const normalized = {
      mood: mood,
      energy: energy,
      anxiety: 10 - anxiety,
      sleep: sleep
    };
    const average = Number((((normalized.mood + normalized.energy + normalized.anxiety + normalized.sleep) / 4)).toFixed(1));

    const entries: Array<{ key: 'mood' | 'energy' | 'anxiety' | 'sleep'; value: number; label: string }> = [
      { key: 'mood', value: normalized.mood, label: 'Overall Mood' },
      { key: 'energy', value: normalized.energy, label: 'Energy' },
      { key: 'anxiety', value: normalized.anxiety, label: 'Calmness' },
      { key: 'sleep', value: normalized.sleep, label: 'Sleep Quality' }
    ];
    const lowest = entries.reduce((min, curr) => (curr.value < min.value ? curr : min), entries[0]);

    setIsLoadingSuggestion(true);
    const aiSuggestion = await fetchSuggestion(average, lowest.key, { mood, energy, anxiety, sleep }, selectedFactors);
    setIsLoadingSuggestion(false);

    setReport({
      average,
      lowestKey: lowest.key,
      lowestLabel: lowest.label,
      suggestion: aiSuggestion || (lowest.key === 'mood' ? 'Consider a short walk, journaling, or connecting with a friend.' : lowest.key === 'energy' ? 'Try light movement, hydration, and a balanced snack.' : lowest.key === 'anxiety' ? 'Practice 5 minutes of deep breathing or grounding.' : 'Aim for a consistent bedtime and limit screens before bed.'),
      breakdown: { mood, energy, anxiety, sleep }
    });
    
    setMood(7);
    setEnergy(6);
    setAnxiety(4);
    setSleep(4);
    setNotes('');
    setSelectedFactors([]);
  };

  const Slider = ({ 
    label, 
    value, 
    onChange, 
    min = 1, 
    max = 10, 
    icon: Icon, 
    color,
    lowLabel,
    highLabel 
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    icon: React.ComponentType<any>;
    color: string;
    lowLabel: string;
    highLabel: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Icon className={`h-5 w-5 ${color} mr-2`} />
          <span className="font-medium text-gray-900">{label}</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          value >= 8 ? 'bg-green-100 text-green-800' :
          value >= 6 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}/10
        </div>
      </div>
      
      <div className="space-y-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">How are you feeling today?</h1>
        <p className="text-gray-600">Track your mood, energy, and well-being to identify patterns</p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
        {/* Date */}
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <Calendar className="h-5 w-5" />
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>

        {/* Sliders */}
        <div className="space-y-8">
          <Slider
            label="Overall Mood"
            value={mood}
            onChange={setMood}
            icon={Heart}
            color="text-pink-500"
            lowLabel="Very Low"
            highLabel="Excellent"
          />

          <Slider
            label="Energy Level"
            value={energy}
            onChange={setEnergy}
            icon={Energy}
            color="text-yellow-500"
            lowLabel="Exhausted"
            highLabel="Energetic"
          />

          <Slider
            label="Anxiety Level"
            value={anxiety}
            onChange={setAnxiety}
            icon={Shield}
            color="text-red-500"
            lowLabel="Very Calm"
            highLabel="Very Anxious"
          />

          <Slider
            label="Sleep Quality"
            value={sleep}
            onChange={setSleep}
            icon={Moon}
            color="text-indigo-500"
            lowLabel="Poor"
            highLabel="Excellent"
          />
        </div>

        {/* Mood Factors */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">What's affecting your mood today?</h3>
          <div className="flex flex-wrap gap-2">
            {moodFactors.map(factor => (
              <button
                key={factor}
                type="button"
                onClick={() => handleFactorToggle(factor)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedFactors.includes(factor)
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                {factor}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Report (replaces Additional Notes) */}
        <div className="space-y-2">
          <h3 className="block font-medium text-gray-900">Summary Report</h3>
          <div className="w-full rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-3 text-sm text-indigo-900">
            {isLoadingSuggestion ? 'Generating personalized suggestion...' : 'A personalized summary (average score, lowest area, and suggestions) will appear right after you save today’s entry.'}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Save Mood Entry
        </button>
      </form>
      {report && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Today's Summary</h3>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">Average: {report.average}/10</span>
          </div>
          <div className="text-gray-700">
            <p className="mb-2">Based on your inputs:</p>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li>Overall Mood: <span className="font-medium">{report.breakdown.mood}/10</span></li>
              <li>Energy: <span className="font-medium">{report.breakdown.energy}/10</span></li>
              <li>Anxiety: <span className="font-medium">{report.breakdown.anxiety}/10</span></li>
              <li>Sleep Quality: <span className="font-medium">{report.breakdown.sleep}/10</span></li>
            </ul>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-900 text-sm">
              Your lowest area today is <span className="font-semibold">{report.lowestLabel}</span>. {report.suggestion}
            </p>
          </div>
          <p className="text-xs text-gray-500">Note: Anxiety is interpreted inversely (lower anxiety contributes positively).</p>
        </div>
      )}
    </div>
  );
}