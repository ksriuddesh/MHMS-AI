import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Save, User, Phone, Mail, MapPin, Calendar, Heart, Activity, Edit2, CheckCircle, Copy, LogOut } from 'lucide-react';

export default function PatientProfile() {
  const { patientProfile, setPatientProfile } = useData();
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ ...patientProfile });
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-fill from logged-in user (Google or email login)
  React.useEffect(() => {
    const loadProfile = async () => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/patient-profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.profile) {
              setForm(data.profile);
              setPatientProfile(data.profile);
              return;
            }
          }
        } catch (error) {
          console.error('Load profile error:', error);
        }
      }

      // Fallback: Auto-fill from logged-in user if no profile in DB
      if (user && !patientProfile.firstName) {
        const nameParts = user.name?.split(' ') || [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const email = user.email || '';
        
        setForm(prev => ({
          ...prev,
          firstName: prev.firstName || firstName,
          lastName: prev.lastName || lastName,
          email: prev.email || email
        }));
      }
    };

    loadProfile();
  }, [user]);

  // Auto-generate patient ID if not set
  React.useEffect(() => {
    if (!patientProfile.patientId) {
      const generatedId = `MH${Date.now().toString().slice(-8)}`;
      setForm(prev => ({ ...prev, patientId: generatedId }));
    }
  }, [patientProfile.patientId]);

  const age = useMemo(() => {
    if (!form.dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(form.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }, [form.dateOfBirth]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      let token = localStorage.getItem('authToken');
      
      // If no token but user is logged in, they need to re-login
      if (!token && !user) {
        alert('Please login first');
        return;
      }
      
      // If logged in but no token, force re-authentication
      if (!token && user) {
        alert('Your session has expired. Please logout and login again.');
        return;
      }

      const response = await fetch(`${API_URL}/api/patient-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        const data = await response.json();
        setPatientProfile({ ...form });
        setSaved(true);
        setIsEditing(false);
        setTimeout(() => setSaved(false), 3000);
        console.log('Profile saved to MongoDB:', data);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to save profile'}`);
      }
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  // Copy Patient ID to clipboard
  const copyPatientId = () => {
    navigator.clipboard.writeText(displayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Use saved profile for display, not form state
  const displayName = `${patientProfile.firstName || ''} ${patientProfile.lastName || ''}`.trim() || 
                      user?.name || 
                      'Patient Name';
  const displayId = patientProfile.patientId || form.patientId || 'Generating...';
  const fullAddress = [form.addressLine1, form.addressLine2, form.city, form.state, form.zip].filter(Boolean).join(', ') || 'N/A';

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Header Card - Improved Visibility */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-200 p-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-4 rounded-full">
            <User className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {displayName}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-lg font-semibold text-gray-700">
                ID: {displayId}
              </p>
              <button
                onClick={copyPatientId}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy Patient ID">
                {copied ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-semibold">
                <Edit2 className="h-5 w-5" />
                Edit Profile
              </button>
            )}
            <button
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-semibold"
              title="Logout and return to login page">
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {saved && (
        <div className="bg-green-100 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <p className="text-green-800 font-semibold text-lg">Profile saved successfully to database!</p>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">First Name</label>
                <input 
                  name="firstName" 
                  value={form.firstName} 
                  onChange={onChange} 
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Last Name</label>
                <input 
                  name="lastName" 
                  value={form.lastName} 
                  onChange={onChange} 
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Date of Birth</label>
                <input 
                  type="date" 
                  name="dateOfBirth" 
                  value={form.dateOfBirth} 
                  onChange={onChange} 
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Gender</label>
                <input 
                  name="gender" 
                  value={form.gender} 
                  onChange={onChange} 
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                  placeholder="Male/Female/Other"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Patient ID (Auto-generated)</label>
                <input 
                  name="patientId" 
                  value={form.patientId} 
                  readOnly 
                  disabled
                  className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-600 font-semibold cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Phone</label>
                <input 
                  name="phone" 
                  value={form.phone} 
                  onChange={onChange} 
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-bold text-gray-800 mb-2">Email</label>
              <input 
                name="email" 
                type="email"
                value={form.email} 
                onChange={onChange} 
                className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Address</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Address Line 1</label>
                <input 
                  name="addressLine1" 
                  value={form.addressLine1} 
                  onChange={onChange} 
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Address Line 2</label>
                <input 
                  name="addressLine2" 
                  value={form.addressLine2} 
                  onChange={onChange} 
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                  placeholder="Apartment, suite, etc."
                />
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">City</label>
                  <input 
                    name="city" 
                    value={form.city} 
                    onChange={onChange} 
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">State</label>
                  <input 
                    name="state" 
                    value={form.state} 
                    onChange={onChange} 
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">ZIP Code</label>
                  <input 
                    name="zip" 
                    value={form.zip} 
                    onChange={onChange} 
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold text-lg flex items-center justify-center gap-3 shadow-lg">
              <Save className="h-6 w-6" />
              Save Profile
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-8 py-4 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-bold text-lg">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Patient Demographics */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Patient Demographics</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Date of Birth (Age)</p>
                  <p className="text-base font-medium text-gray-900">{form.dateOfBirth || 'N/A'} (Age: {age})</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="text-base font-medium text-gray-900">{form.gender || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Primary Contact</p>
                  <p className="text-base font-medium text-gray-900">{form.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base font-medium text-gray-900">{form.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">{fullAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Vitals Dashboard */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Live Vitals Dashboard</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">as of {new Date().toLocaleString()}</span>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 mb-1">❤️ Heart Rate</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">-- bpm</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Trend: →</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">🩸 Blood Pressure</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">--/-- mmHg</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
                <p className="text-sm text-cyan-700 dark:text-cyan-300 mb-1">💨 SpO₂</p>
                <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">--%</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">🌡️ Temperature</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">-- °C</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 italic">* Vitals integration coming soon. Connect your health devices for real-time monitoring.</p>
          </div>

          {/* Medical Summary Placeholder */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">🩺 Medical Summary</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Active Conditions</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No active conditions recorded. Medical history integration coming soon.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Medications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No medications recorded. Medication tracking coming soon.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
