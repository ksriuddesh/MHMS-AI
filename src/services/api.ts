const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Mood Entries API
export const moodAPI = {
  getAll: (userId: string) => 
    apiCall(`/mood-entries/${userId}`),
  
  getById: (id: string) =>
    apiCall(`/mood-entries/entry/${id}`),
  
  create: (data: any) =>
    apiCall('/mood-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    apiCall(`/mood-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiCall(`/mood-entries/${id}`, {
      method: 'DELETE',
    }),
};

// Assessments API
export const assessmentAPI = {
  getAll: (userId: string) =>
    apiCall(`/assessments/${userId}`),
  
  getById: (id: string) =>
    apiCall(`/assessments/entry/${id}`),
  
  create: (data: any) =>
    apiCall('/assessments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    apiCall(`/assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiCall(`/assessments/${id}`, {
      method: 'DELETE',
    }),
};

// Patient Profile API
export const patientProfileAPI = {
  get: (userId: string) =>
    apiCall(`/patient-profile/${userId}`),
  
  createOrUpdate: (data: any) =>
    apiCall('/patient-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (userId: string, data: any) =>
    apiCall(`/patient-profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (userId: string) =>
    apiCall(`/patient-profile/${userId}`, {
      method: 'DELETE',
    }),
};
