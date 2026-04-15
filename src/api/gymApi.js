/**
 * GymFlow — API Client
 * =====================
 * Fetch wrappers for all backend endpoints.
 */

const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

// ── Plans ─────────────────────────────────────────────────

export const getPlans = () => request('/plans');

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
