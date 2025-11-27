import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, getRedirectResult, User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth, getGoogleProvider, logAnalyticsEvent, analyticsSetUserId, isFirebaseConfigured, getDb } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    privacy: 'private' | 'limited' | 'open';
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
  register?: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle?: () => Promise<void>;
  resetPassword?: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Seed a default user if none exist
    const usersRaw = localStorage.getItem('mh_users');
    if (!usersRaw) {
      (async () => {
        const passwordHash = await hashPassword('Admin@123');
        const defaultUsers: StoredUser[] = [
          {
            email: 'admin@mindwell.app',
            name: 'Admin',
            passwordHash,
            avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Admin'
          }
        ];
        localStorage.setItem('mh_users', JSON.stringify(defaultUsers));
      })();
    }

    // Check for existing auth
    const savedUser = localStorage.getItem('mentalHealthUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    // Firebase auth state listener
    let unsub: (() => void) | undefined;
    if (isFirebaseConfigured()) {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const firebaseUser: User = {
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            avatar: fbUser.photoURL || undefined,
            preferences: {
              theme: 'light',
              notifications: true,
              privacy: 'limited'
            }
          };
          await persistUserProfile(firebaseUser);
          setUser(firebaseUser);
          // Do NOT set justLoggedIn here to avoid showing the modal on every refresh
        }
      });
      // Ensure redirect sign-in results complete session initialization
      getRedirectResult(auth)
        .then(async (cred) => {
          if (cred && cred.user) {
            const fb = cred.user;
            const firebaseUser: User = {
              id: fb.uid,
              email: fb.email || '',
              name: fb.displayName || fb.email?.split('@')[0] || 'User',
              avatar: fb.photoURL || undefined,
              preferences: {
                theme: 'light',
                notifications: true,
                privacy: 'limited'
              }
            };
            await persistUserProfile(firebaseUser);
            setUser(firebaseUser);
          }
        })
        .catch(() => {});
    }
    setIsLoading(false);
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Send login request to MongoDB backend
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      const authenticatedUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        avatar: data.user.avatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(data.user.email)}`,
        preferences: {
          theme: 'light',
          notifications: true,
          privacy: 'limited'
        }
      };
      
      setUser(authenticatedUser);
      localStorage.setItem('mentalHealthUser', JSON.stringify(authenticatedUser));
      localStorage.setItem('authToken', data.token);
      sessionStorage.setItem('justLoggedIn', '1');
      
      await analyticsSetUserId(authenticatedUser.id);
      await logAnalyticsEvent('login', { method: 'password' });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Send registration request to MongoDB backend
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();

      const authenticatedUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        avatar: data.user.avatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(data.user.email)}`,
        preferences: {
          theme: 'light',
          notifications: true,
          privacy: 'limited'
        }
      };
      
      setUser(authenticatedUser);
      localStorage.setItem('mentalHealthUser', JSON.stringify(authenticatedUser));
      localStorage.setItem('authToken', data.token);
      sessionStorage.setItem('justLoggedIn', '1');
      
      await analyticsSetUserId(authenticatedUser.id);
      await logAnalyticsEvent('sign_up', { method: 'password' });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mentalHealthUser');
    localStorage.removeItem('authToken');
    try { sessionStorage.removeItem('justLoggedIn'); } catch {}
    // Also sign out from Firebase if signed in
    if (isFirebaseConfigured()) {
      const auth = getFirebaseAuth();
      signOut(auth).catch(() => {});
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('mentalHealthUser', JSON.stringify(updatedUser));
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (!isFirebaseConfigured()) {
        throw new Error('Google Sign-In is not configured');
      }
      const auth = getFirebaseAuth();
      const provider = getGoogleProvider();
      provider.setCustomParameters({ prompt: 'select_account consent' });
      const cred = await signInWithPopup(auth, provider);
      
      if (cred && cred.user) {
        const fb = cred.user;
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        // Send Google login data to MongoDB backend
        try {
          const response = await fetch(`${API_URL}/api/auth/google-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uid: fb.uid,
              email: fb.email,
              name: fb.displayName,
              avatar: fb.photoURL,
              provider: 'google'
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const firebaseUser: User = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              avatar: data.user.avatar || fb.photoURL || undefined,
              preferences: {
                theme: 'light',
                notifications: true,
                privacy: 'limited'
              }
            };
            
            setUser(firebaseUser);
            localStorage.setItem('mentalHealthUser', JSON.stringify(firebaseUser));
            localStorage.setItem('authToken', data.token);
            sessionStorage.setItem('justLoggedIn', '1');
            
            await persistUserProfile(firebaseUser);
            await analyticsSetUserId(firebaseUser.id);
            await logAnalyticsEvent('login', { method: 'google' });
          } else {
            throw new Error('Failed to authenticate with backend');
          }
        } catch (backendError) {
          console.error('Backend authentication error:', backendError);
          throw new Error('Unable to authenticate with server. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!email) {
        throw new Error('Email is required');
      }

      const users = getUsers();
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!found) {
        throw new Error('No account found with this email address');
      }

      // In a real application, this would send an actual email
      // For demo purposes, we'll just simulate success
      console.log(`Password reset email would be sent to: ${email}`);
      
      // Simulate email sent successfully
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading, register, loginWithGoogle, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

async function persistUserProfile(firebaseUser: User) {
  setUserState(firebaseUser);
  try {
    const db = getDb();
    const ref = doc(db, 'users', firebaseUser.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        email: firebaseUser.email,
        name: firebaseUser.name,
        avatar: firebaseUser.avatar ?? null,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        provider: 'google'
      });
    } else {
      await setDoc(ref, {
        lastLoginAt: serverTimestamp()
      }, { merge: true });
    }
    await analyticsSetUserId(firebaseUser.id);
    await logAnalyticsEvent('login', { method: 'google' });
  } catch {
    // ignore firestore errors for auth flow
  }
}

function setUserState(u: User) {
  try {
    localStorage.setItem('mentalHealthUser', JSON.stringify(u));
  } catch {}
}

// Local user store (simplified for demo; do not use in production)
interface StoredUser {
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
}

function getUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem('mh_users');
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function cryptoRandomId(): string {
  try {
    const arr = new Uint8Array(8);
    (window.crypto || (window as any).msCrypto).getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Date.now().toString(16);
  }
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await (window.crypto || (window as any).msCrypto).subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}