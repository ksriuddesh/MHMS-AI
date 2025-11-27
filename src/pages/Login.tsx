import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowRight, Quote, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, loginWithGoogle, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
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
            <h2 className="text-4xl font-extrabold leading-tight mb-4">Your mental wellness, beautifully organized</h2>
            <p className="text-indigo-100 text-lg">Track moods, complete assessments, and get insights that help you feel better—every day.</p>
          </div>
        </div>

        <div className="relative z-10 px-12 pb-12">
          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md">
            <div className="flex items-start text-white">
              <Quote className="h-6 w-6 opacity-70 mr-2" />
              <p className="text-indigo-100">“MindWell has helped me understand my patterns and build habits that truly stick.”</p>
            </div>
            <p className="mt-3 text-indigo-200 text-sm">Alex Johnson</p>
          </div>
        </div>
      </div>

      {/* Right: Auth panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900">MindWell</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600 mb-8">Sign in to continue your wellness journey</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <a href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-60 flex items-center justify-center"
            >
              {isLoading ? 'Signing in...' : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/register" className="text-indigo-600 hover:text-indigo-800 font-medium">Create one</a>
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


