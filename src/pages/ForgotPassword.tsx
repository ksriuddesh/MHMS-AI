import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldCheck, CheckCircle, Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOTP(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('otp');
        setOtpTimer(600); // 10 minutes
        setCanResendOTP(false);
        setSuccess('OTP sent successfully! Check your email.');
        setRemainingAttempts(3);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        if (response.status === 429) {
          setError(`${data.message} (${data.remainingTime}s remaining)`);
        } else {
          setError(data.message || 'Failed to send OTP');
        }
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please check if the backend server is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResendOTP) return;
    
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpTimer(600); // 10 minutes
        setCanResendOTP(false);
        setSuccess('New OTP sent successfully!');
        setRemainingAttempts(3);
        setOtp(''); // Clear previous OTP input
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        if (response.status === 429) {
          setError(`${data.message} (${data.remainingTime}s remaining)`);
        } else {
          setError(data.message || 'Failed to resend OTP');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetToken(data.resetToken);
        setStep('password');
        setSuccess('OTP verified successfully! Now set your new password.');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
          setError(`${data.message} (${data.remainingAttempts} attempts remaining)`);
        } else {
          setError(data.message || 'Invalid OTP');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
        setSuccess('Password reset successfully! You can now login with your new password.');
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleStartOver = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    setOtpTimer(0);
    setCanResendOTP(false);
    setRemainingAttempts(3);
  };

  // Email step
  if (step === 'email') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Forgot Password?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we'll send you an OTP to reset your password.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleRequestOTP}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex items-center text-sm text-indigo-600 hover:text-indigo-500"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // OTP step
  if (step === 'otp') {
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
              <h2 className="text-4xl font-extrabold leading-tight mb-4">Verify your identity</h2>
              <p className="text-indigo-100 text-lg">Enter the 6-digit code we sent to your email to continue with password reset.</p>
            </div>
          </div>
        </div>

        {/* Right: OTP form panel */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden flex items-center">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">MindWell</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Enter OTP</h1>
            <p className="text-gray-600 mb-2">
              We've sent a 6-digit code to
            </p>
            <p className="text-indigo-600 font-semibold mb-6">{email}</p>
            
            {otpTimer > 0 && (
              <div className="mb-6 inline-flex items-center bg-indigo-50 px-4 py-2 rounded-lg">
                <span className="text-sm text-gray-700">Expires in: </span>
                <span className="ml-2 font-mono font-bold text-indigo-600">{formatTime(otpTimer)}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">OTP Code</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  required
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  maxLength={6}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-3xl font-mono tracking-[0.5em] font-bold"
                  placeholder="· · · · · ·"
                  autoComplete="off"
                />
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Check your email inbox (and spam folder)
                </p>
              </div>

              {remainingAttempts < 3 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <div className="flex items-center">
                    <span className="text-yellow-700 font-medium text-sm">
                      ⚠️ {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Verify OTP'
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Use different email
                </button>
                
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={!canResendOTP || isLoading}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoading && 'animate-spin'}`} />
                  {canResendOTP ? 'Resend code' : `Wait ${formatTime(otpTimer)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Password step
  if (step === 'password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Set New Password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Create a strong password for your account
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 6 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Success step
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto h-20 w-20 bg-green-600 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Password Reset Successful!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your password has been successfully reset. You can now login with your new password.
          </p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleBackToLogin}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go to Login
          </button>
          
          <button
            onClick={handleStartOver}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            Reset Another Password
          </button>
        </div>

        <p className="text-xs text-gray-500">
          A confirmation email has been sent to your inbox
        </p>
      </div>
    </div>
  );
}
