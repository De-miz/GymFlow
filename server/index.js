/**
 * GymFlow — Express API Server
 * =============================
 * RESTful endpoints for the React frontend.
 * Runs on port 3001, proxied by Vite in development.
 */

import express from 'express';
import cors from 'cors';
import {
  getAllPlans,
  getAllMembers,
  getMemberById,
  addMember,
  removeMember,
  checkIn,
  getAccessLogs,
  getRecentLogs,
  getMetrics,
  seedDemoData
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Plans ─────────────────────────────────────────────────

app.get('/api/plans', (req, res) => {
  try {
    res.json(getAllPlans());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Members ───────────────────────────────────────────────

app.get('/api/members', (req, res) => {
  try {
    res.json(getAllMembers());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/members/:id', (req, res) => {
  try {
    const member = getMemberById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/members', (req, res) => {
  try {
    const { name, email, phone, planTier } = req.body;
    if (!name || !email || !phone || !planTier) {
      return res.status(400).json({ error: 'Missing required fields: name, email, phone, planTier' });
    }
    const member = addMember(name, email, phone, planTier);
    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/members/:id', (req, res) => {
  try {
    removeMember(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ── Check-in ──────────────────────────────────────────────

app.post('/api/checkin', (req, res) => {
  try {
    const { memberId } = req.body;
    if (!memberId) return res.status(400).json({ error: 'memberId is required' });
    const result = checkIn(memberId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Access Logs ───────────────────────────────────────────

app.get('/api/logs', (req, res) => {
  try {
    const filter = req.query.filter || 'all';
    res.json(getAccessLogs(filter));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/logs/recent', (req, res) => {
  try {
    const n = parseInt(req.query.n) || 5;
    res.json(getRecentLogs(n));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Metrics ───────────────────────────────────────────────

app.get('/api/metrics', (req, res) => {
  try {
    res.json(getMetrics());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Seed ──────────────────────────────────────────────────

app.post('/api/seed', (req, res) => {
  try {
    const seeded = seedDemoData();
    res.json({ seeded, message: seeded ? 'Demo data created' : 'Data already exists' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────

app.listen(PORT, () => {
  // Auto-seed on first run
  seedDemoData();
  console.log(`⚡ GymFlow API server running on http://localhost:${PORT}`);
});
