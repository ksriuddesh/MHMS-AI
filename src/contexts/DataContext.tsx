import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface MoodEntry {
  id: string;
  date: string;
  mood: number;
  energy: number;
  anxiety: number;
  sleep: number;
  notes: string;
  factors: string[];
  location?: string;
}

export interface Assessment {
  id: string;
  type: 'PHQ-9' | 'GAD-7' | 'PSS-10' | 'Custom' | 'Depression' | 'Anxiety' | 'Stress' | 'Wellbeing' | 'Social' | 'Lifestyle';
  date: string;
  score: number;
  maxScore: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  responses: Record<string, number>;
  questions?: string[];
  followUpQuestions?: string[];
  followUpResponses?: Record<string, number>;
  domain?: 'Depression' | 'Anxiety' | 'Stress' | 'Wellbeing' | 'Social' | 'Lifestyle' | 'Custom';
}

export interface PatientProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO yyyy-mm-dd
  gender: string;
  patientId: string; // MRN or ID
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  distance: string;
  avatar: string;
  available: boolean;
  acceptsInsurance: boolean;
  languages: string[];
  nextAvailable: string;
}

interface DataContextType {
  moodEntries: MoodEntry[];
  assessments: Assessment[];
  providers: Provider[];
  dailyScore: number;
  weeklyTrend: number;
  patientProfile: PatientProfile;
  setPatientProfile: (p: PatientProfile) => void;
  addMoodEntry: (entry: Omit<MoodEntry, 'id'>) => void;
  addAssessment: (assessment: Omit<Assessment, 'id'>) => void;
  updateAssessment: (id: string, patch: Partial<Assessment>) => void;
  removeAssessment: (id: string) => void;
  getDailyScore: (date: string) => number;
  getWeeklyAverage: () => number;
  isProfileComplete: () => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Helper to get user-specific localStorage key
  const getUserKey = (key: string) => user ? `${key}_${user.id}` : key;
  
  // Load from localStorage on init (user-specific)
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [patientProfileState, setPatientProfileState] = useState<PatientProfile>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    patientId: ''
  });
  
  // Load user-specific data when user changes
  useEffect(() => {
    if (!user) {
      setMoodEntries([]);
      setAssessments([]);
      setPatientProfileState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        patientId: ''
      });
      return;
    }
    
    // Load mood entries
    try {
      const saved = localStorage.getItem(getUserKey('mhms_moodEntries'));
      setMoodEntries(saved ? JSON.parse(saved) : []);
    } catch { setMoodEntries([]); }
    
    // Load assessments
    try {
      const saved = localStorage.getItem(getUserKey('mhms_assessments'));
      setAssessments(saved ? JSON.parse(saved) : []);
    } catch { setAssessments([]); }
    
    // Load patient profile
    try {
      const saved = localStorage.getItem(getUserKey('mhms_patientProfile'));
      const profile = saved ? JSON.parse(saved) : {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        patientId: ''
      };
      console.log('📋 Loaded patient profile for user:', user.id, profile);
      setPatientProfileState(profile);
    } catch {
      setPatientProfileState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        patientId: ''
      });
    }
  }, [user]);

  // Wrapper to save immediately when profile is updated
  const setPatientProfile = (profile: PatientProfile) => {
    if (!user) return;
    console.log('💾 Saving patient profile for user:', user.id, profile);
    setPatientProfileState(profile);
    try {
      localStorage.setItem(getUserKey('mhms_patientProfile'), JSON.stringify(profile));
      console.log('✅ Patient profile saved to localStorage');
    } catch (e) {
      console.error('❌ Failed to save patient profile:', e);
    }
  };
  const [providers] = useState<Provider[]>([
    {
      id: '1',
      name: 'Dr. Sarah Mitchell',
      specialty: 'Clinical Psychology',
      rating: 4.9,
      distance: '2.3 miles',
      avatar: 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=400',
      available: true,
      acceptsInsurance: true,
      languages: ['English', 'Spanish'],
      nextAvailable: '2024-01-20T14:00:00'
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'Psychiatry',
      rating: 4.8,
      distance: '1.8 miles',
      avatar: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=400',
      available: true,
      acceptsInsurance: true,
      languages: ['English', 'Mandarin'],
      nextAvailable: '2024-01-18T10:30:00'
    },
    {
      id: '3',
      name: 'Dr. Emma Rodriguez',
      specialty: 'Cognitive Behavioral Therapy',
      rating: 4.7,
      distance: '3.1 miles',
      avatar: 'https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=400',
      available: false,
      acceptsInsurance: true,
      languages: ['English', 'Spanish'],
      nextAvailable: '2024-01-22T16:00:00'
    }
  ]);

  useEffect(() => {
    // Initialize with sample data
    const sampleMoodEntries: MoodEntry[] = [
      {
        id: '1',
        date: '2024-01-15',
        mood: 7,
        energy: 6,
        anxiety: 4,
        sleep: 8,
        notes: 'Had a good day at work, feeling optimistic',
        factors: ['work', 'exercise', 'social']
      },
      {
        id: '2',
        date: '2024-01-14',
        mood: 5,
        energy: 4,
        anxiety: 6,
        sleep: 6,
        notes: 'Felt anxious about upcoming presentation',
        factors: ['work', 'stress']
      },
      {
        id: '3',
        date: '2024-01-13',
        mood: 8,
        energy: 7,
        anxiety: 3,
        sleep: 9,
        notes: 'Great weekend with friends, well-rested',
        factors: ['social', 'rest', 'leisure']
      }
    ];

    const sampleAssessments: Assessment[] = [
      {
        id: '1',
        type: 'PHQ-9',
        date: '2024-01-15',
        score: 8,
        maxScore: 27,
        severity: 'mild',
        responses: {}
      },
      {
        id: '2',
        type: 'GAD-7',
        date: '2024-01-10',
        score: 6,
        maxScore: 21,
        severity: 'mild',
        responses: {}
      }
    ];

    setMoodEntries(sampleMoodEntries);
    setAssessments(sampleAssessments);
  }, []);

  // Persist to localStorage whenever data changes (user-specific)
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(getUserKey('mhms_moodEntries'), JSON.stringify(moodEntries));
    } catch (e) { console.error('Failed to save mood entries:', e); }
  }, [moodEntries, user]);

  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(getUserKey('mhms_assessments'), JSON.stringify(assessments));
      console.log('💾 Saved assessments to localStorage:', assessments.length);
    } catch (e) { console.error('Failed to save assessments:', e); }
  }, [assessments, user]);

  // Patient profile saves immediately via setPatientProfile wrapper, no useEffect needed

  const addMoodEntry = (entry: Omit<MoodEntry, 'id'>) => {
    const newEntry: MoodEntry = {
      ...entry,
      id: Date.now().toString()
    };
    setMoodEntries(prev => [newEntry, ...prev]);
  };

  const addAssessment = (assessment: Omit<Assessment, 'id'>) => {
    const newAssessment: Assessment = {
      ...assessment,
      id: Date.now().toString()
    };
    console.log('✅ Adding new assessment:', newAssessment);
    setAssessments(prev => {
      const updated = [newAssessment, ...prev];
      console.log('✅ Updated assessments array:', updated.length, 'items');
      return updated;
    });
  };

  const updateAssessment = (id: string, patch: Partial<Assessment>) => {
    setAssessments(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  const removeAssessment = (id: string) => {
    setAssessments(prev => prev.filter(a => a.id !== id));
  };

  const getDailyScore = (date: string) => {
    const entry = moodEntries.find(e => e.date === date);
    if (!entry) return 0;
    
    // Calculate comprehensive daily score
    const moodScore = (entry.mood / 10) * 25;
    const energyScore = (entry.energy / 10) * 20;
    const anxietyScore = ((10 - entry.anxiety) / 10) * 25;
    const sleepScore = (entry.sleep / 10) * 20;
    const factorsScore = entry.factors.length * 2.5;
    
    return Math.round(moodScore + energyScore + anxietyScore + sleepScore + factorsScore);
  };

  const getWeeklyAverage = () => {
    const recentEntries = moodEntries.slice(0, 7);
    if (recentEntries.length === 0) return 0;
    
    const total = recentEntries.reduce((sum, entry) => sum + getDailyScore(entry.date), 0);
    return Math.round(total / recentEntries.length);
  };

  const isProfileComplete = () => {
    return !!(patientProfileState.firstName && 
              patientProfileState.lastName && 
              patientProfileState.dateOfBirth && 
              patientProfileState.gender && 
              patientProfileState.patientId);
  };

  const dailyScore = getDailyScore(new Date().toISOString().split('T')[0]);
  const weeklyTrend = getWeeklyAverage();

  return (
    <DataContext.Provider value={{
      moodEntries,
      assessments,
      providers,
      dailyScore,
      weeklyTrend,
      patientProfile: patientProfileState,
      setPatientProfile,
      addMoodEntry,
      addAssessment,
      updateAssessment,
      removeAssessment,
      getDailyScore,
      getWeeklyAverage,
      isProfileComplete
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}