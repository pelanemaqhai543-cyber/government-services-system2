import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Add a response interceptor to gracefully handle AI 404s
API.interceptors.response.use(
  (response) => {
    // Unwrap the { value: [] } format for queues
    if (response.data && response.data.value && Array.isArray(response.data.value)) {
      response.data = response.data.value;
    }
    return response;
  },
  (error) => {
    // If the AI endpoint returns 404 (because it hasn't run yet), don't crash the UI.
    // Just return a safe fallback.
    if (error.response && error.response.status === 404) {
      if (error.config.url.includes('/ai/summary') || error.config.url.includes('/rules/evaluate')) {
        return Promise.resolve({
          data: {
            recommendation: 'escalate',
            risk_score: 50,
            summary: 'AI analysis pending. The officer must review this manually.',
            findings: ['AI has not yet processed this application.'],
            rule_result: { eligible: false, reason: 'Pending manual review', rule_id: 'PENDING' }
          }
        });
      }
    }
    return Promise.reject(error);
  }
);

export default API;