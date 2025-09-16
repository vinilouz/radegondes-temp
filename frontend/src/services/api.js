import { API_BASE_URL } from '../config/api';

export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed.');
  }
  return data;
}
export async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed.');
  }
  return data;
}
export async function getApiData(token, endpoint = '/api/dashboard-data') {
  if (!token) {
    throw new Error('No token found. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Error fetching API data.');
    error.status = response.status;
    throw error;
  }

  return data;
}

// Study Logs
export async function saveStudyLog(token, logData) {
  if (!token) {
    throw new Error('No token found. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}/api/study-logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(logData),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Error saving study log.');
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function fetchStudyLogs(token, filters = {}) {
  if (!token) {
    throw new Error('No token found. Please log in again.');
  }

  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE_URL}/api/study-logs?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Error fetching study logs.');
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function fetchSubjectStats(token, subjectId) {
  if (!token) {
    throw new Error('No token found. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}/api/subjects/${subjectId}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Error fetching subject statistics.');
    error.status = response.status;
    throw error;
  }

  return data;
}
