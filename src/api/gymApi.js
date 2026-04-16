/**
 * GymFlow — API Client
 * =====================
 * Fetch wrappers for all backend endpoints.
 */

const API_BASE = '/api';

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = localStorage.getItem('adminToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && !url.startsWith('/auth')) {
    localStorage.removeItem('adminToken');
    window.location.reload();
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

// ── Authentication ────────────────────────────────────────

export const registerAdmin = (username, password) =>
  request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

export const getAdmins = () => request('/auth/admins');

// ── Plans ─────────────────────────────────────────────────

export const getPlans = () => request('/plans');

export const updatePlanPrice = (tier, price) => 
  request(`/plans/${tier}`, {
    method: 'PUT',
    body: JSON.stringify({ price })
  });

export const createPlan = (planData) =>
  request('/plans', {
    method: 'POST',
    body: JSON.stringify(planData)
  });

export const deletePlan = (tier) =>
  request(`/plans/${tier}`, {
    method: 'DELETE'
  });

// ── Members ───────────────────────────────────────────────

export const getMembers = () => request('/members');

export const getMember = (id) => request(`/members/${id}`);

export const registerMember = (name, email, phone, planTier) =>
  request('/members', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, planTier }),
  });

export const deleteMember = (id) =>
  request(`/members/${id}`, { method: 'DELETE' });

// ── Check-in ──────────────────────────────────────────────

export const checkIn = (memberId) =>
  request('/checkin', {
    method: 'POST',
    body: JSON.stringify({ memberId }),
  });

// ── Logs ──────────────────────────────────────────────────

export const getLogs = (filter = 'all') =>
  request(`/logs?filter=${filter}`);

export const getRecentLogs = (n = 5) =>
  request(`/logs/recent?n=${n}`);

// ── Metrics ───────────────────────────────────────────────

export const getMetrics = () => request('/metrics');

// ── Seed ──────────────────────────────────────────────────

export const seedData = () => request('/seed', { method: 'POST' });
