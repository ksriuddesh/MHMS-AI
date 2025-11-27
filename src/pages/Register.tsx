import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, User as UserIcon, ArrowRight, Quote } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { register, loginWithGoogle, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      await register?.(name, email, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left: Visual/brand panel */}
      <div className="relative hidden lg:flex flex-col overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex-1 flex items-center justify-center p-12">
          <div className="max-w-md text-white">
            <div className="flex items-center mb-8">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <span className="ml-3 text-2xl font-semibold tracking-tight">MindWell</span>
            </div>
            <h2 className="text-4xl font-extrabold leading-tight mb-4">Start your mindful journey</h2>
            <p className="text-indigo-100 text-lg">Create your account to track your mood, manage assessments, and unlock personalized insights.</p>
          </div>
        </div>

        <div className="relative z-10 px-12 pb-12">
          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md">
            <div className="flex items-start text-white">
              <Quote className="h-6 w-6 opacity-70 mr-2" />
              <p className="text-indigo-100">“The first step is the most important one. MindWell keeps me consistent.”</p>
            </div>
            <p className="mt-3 text-indigo-200 text-sm">Jamie Lee</p>
          </div>
        </div>
      </div>

      {/* Right: Register panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900">MindWell</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create account</h1>
          <p className="text-gray-600 mb-8">Join MindWell in seconds</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Alex Johnson"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-60 flex items-center justify-center"
            >
              {isLoading ? 'Creating account...' : (
                <>
                  Create account
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">Sign in</a>
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={async () => {
                try {
                  await loginWithGoogle?.();
                } catch (err) {}
              }}
              className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center bg-white"
            >
              <img alt="Google" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5 mr-2" />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


