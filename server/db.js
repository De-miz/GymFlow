/**
 * GymFlow — Database Layer (SQLite via better-sqlite3)
 * =====================================================
 * Sets up the schema, provides seed data, and exposes
 * helper functions for all CRUD operations.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let DB_PATH = path.join(__dirname, 'gymflow.db');

// Vercel Serverless File System Support (Read-Only workaround)
if (process.env.VERCEL) {
  DB_PATH = '/tmp/gymflow.db';
  const sourcePath = path.join(__dirname, 'gymflow.db');
  if (!fs.existsSync(DB_PATH) && fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, DB_PATH);
  }
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    tier          TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    price         REAL NOT NULL,
    duration_months INTEGER NOT NULL,
    perks         TEXT NOT NULL DEFAULT '[]',
    color         TEXT NOT NULL DEFAULT '#00e5ff'
  );

  CREATE TABLE IF NOT EXISTS members (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id     TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    phone         TEXT NOT NULL DEFAULT '',
    plan_tier     TEXT NOT NULL REFERENCES plans(tier),
    status        TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
    member_since  TEXT NOT NULL DEFAULT (datetime('now')),
    expiry_date   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS access_logs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id     TEXT NOT NULL,
    member_name   TEXT NOT NULL,
    plan_tier     TEXT NOT NULL,
    status        TEXT NOT NULL CHECK(status IN ('granted','denied')),
    reason        TEXT NOT NULL DEFAULT '',
    timestamp     TEXT NOT NULL DEFAULT (datetime('now'))
  );

`);

// ── Plans (seed once) ─────────────────────────────────────

const insertPlan = db.prepare(`
  INSERT INTO plans (tier, name, price, duration_months, perks, color) VALUES (?, ?, ?, ?, ?, ?)
`);
const checkPlan = db.prepare('SELECT tier FROM plans WHERE tier = ?');

const ensureDefaultPlans = db.transaction(() => {
  if (!checkPlan.get('Basic')) {
    insertPlan.run('Basic', 'Basic', 250, 1,
      JSON.stringify(['Gym Floor Access', 'Locker Room']), '#00e5ff');
  }
  if (!checkPlan.get('Premium')) {
    insertPlan.run('Premium', 'Premium', 600, 3,
      JSON.stringify(['Gym Floor Access', 'Locker Room', 'Group Classes', 'Sauna']), '#a855f7');
  }
  if (!checkPlan.get('VIP')) {
    insertPlan.run('VIP', 'VIP', 1000, 6,
      JSON.stringify(['Full Facility Access', 'Personal Trainer', 'Spa & Sauna', 'Priority Booking', 'Guest Pass']), '#fbbf24');
  }
});
ensureDefaultPlans();


// ── Helper: generate unique random 4-digit member ID ──────

function generateUniqueMemberId() {
  const existing = db.prepare('SELECT member_id FROM members WHERE member_id = ?');
  let id;
  do {
    // Random 4-digit number: 1000–9999
    id = String(Math.floor(1000 + Math.random() * 9000));
  } while (existing.get(id));
  return id;
}


// ── Plans ─────────────────────────────────────────────────

export function getAllPlans() {
  const rows = db.prepare('SELECT * FROM plans ORDER BY price ASC').all();
  return rows.map(r => ({ ...r, perks: JSON.parse(r.perks) }));
}

export function getPlanByTier(tier) {
  const row = db.prepare('SELECT * FROM plans WHERE tier = ?').get(tier);
  if (!row) return null;
  return { ...row, perks: JSON.parse(row.perks) };
}

export function updatePlanPrice(tier, newPrice) {
  const info = db.prepare('UPDATE plans SET price = ? WHERE tier = ?').run(newPrice, tier);
  if (info.changes === 0) throw new Error(`Plan tier ${tier} not found`);
  return getPlanByTier(tier);
}

export function addPlan(tier, name, price, duration_months, perksArray, color) {
  const existing = getPlanByTier(tier);
  if (existing) throw new Error(`Plan tier "${tier}" already exists`);

  const planColor = color || `hsl(${Math.floor(Math.random() * 360)}, 80%, 65%)`;

  db.prepare(`
    INSERT INTO plans (tier, name, price, duration_months, perks, color) 
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(tier, name, price, duration_months, JSON.stringify(perksArray), planColor);
  
  return getPlanByTier(tier);
}

export function removePlan(tier) {
  try {
    const result = db.prepare('DELETE FROM plans WHERE tier = ?').run(tier);
    if (result.changes === 0) throw new Error(`Plan tier ${tier} not found`);
    return true;
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      throw new Error(`Cannot delete plan "${tier}" because members are using it.`);
    }
    throw err;
  }
}


// ── Members ───────────────────────────────────────────────

export function getAllMembers() {
  const rows = db.prepare(`
    SELECT m.*, p.name AS plan_name, p.price AS plan_price,
           p.duration_months AS plan_duration_months, p.perks AS plan_perks, p.color AS plan_color
    FROM members m
    JOIN plans p ON m.plan_tier = p.tier
    ORDER BY m.id DESC
  `).all();

  return rows.map(enrichMember);
}

export function getMemberById(memberId) {
  const row = db.prepare(`
    SELECT m.*, p.name AS plan_name, p.price AS plan_price,
           p.duration_months AS plan_duration_months, p.perks AS plan_perks, p.color AS plan_color
    FROM members m
    JOIN plans p ON m.plan_tier = p.tier
    WHERE m.member_id = ?
  `).get(memberId);

  if (!row) return null;
  return enrichMember(row);
}

export function addMember(name, email, phone, planTier) {
  const plan = getPlanByTier(planTier);
  if (!plan) throw new Error(`Invalid plan tier: ${planTier}`);

  // Duplicate email check
  const existing = db.prepare('SELECT id FROM members WHERE email = ?').get(email);
  if (existing) throw new Error(`A member with email "${email}" already exists`);

  const memberId = generateUniqueMemberId();
  const memberSince = new Date().toISOString();

  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + plan.duration_months);
  const expiryDate = expiry.toISOString();

  db.prepare(`
    INSERT INTO members (member_id, name, email, phone, plan_tier, status, member_since, expiry_date)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
  `).run(memberId, name, email, phone, planTier, memberSince, expiryDate);

  return getMemberById(memberId);
}

export function removeMember(memberId) {
  const result = db.prepare('DELETE FROM members WHERE member_id = ?').run(memberId);
  if (result.changes === 0) throw new Error(`Member ${memberId} not found`);
  return true;
}


// ── Check-in ──────────────────────────────────────────────

export function checkIn(memberId) {
  const member = getMemberById(memberId);

  if (!member) {
    // Unknown member
    const log = insertLog(memberId, 'Unknown', 'N/A', 'denied', 'Member ID not found');
    return { success: false, reason: 'Member ID not found', log };
  }

  if (!member.isActive) {
    const reason = member.status === 'suspended' ? 'Membership suspended' : 'Membership expired';
    const log = insertLog(memberId, member.name, member.plan_tier, 'denied', reason);
    return { success: false, reason, member, log };
  }

  // Access granted
  const log = insertLog(memberId, member.name, member.plan_tier, 'granted', 'Valid membership');
  return { success: true, member, log };
}


// ── Access Logs ───────────────────────────────────────────

function insertLog(memberId, memberName, planTier, status, reason) {
  const timestamp = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO access_logs (member_id, member_name, plan_tier, status, reason, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(memberId, memberName, planTier, status, reason, timestamp);

  return {
    id: result.lastInsertRowid,
    member_id: memberId,
    member_name: memberName,
    plan_tier: planTier,
    status,
    reason,
    timestamp
  };
}

export function getAccessLogs(filter = 'all') {
  let query = 'SELECT al.*, p.color AS plan_color FROM access_logs al LEFT JOIN plans p ON al.plan_tier = p.tier ORDER BY al.id DESC';
  if (filter === 'granted') query = "SELECT al.*, p.color AS plan_color FROM access_logs al LEFT JOIN plans p ON al.plan_tier = p.tier WHERE al.status = 'granted' ORDER BY al.id DESC";
  if (filter === 'denied') query = "SELECT al.*, p.color AS plan_color FROM access_logs al LEFT JOIN plans p ON al.plan_tier = p.tier WHERE al.status = 'denied' ORDER BY al.id DESC";
  return db.prepare(query).all();
}

export function getRecentLogs(n = 5) {
  return db.prepare('SELECT al.*, p.color AS plan_color FROM access_logs al LEFT JOIN plans p ON al.plan_tier = p.tier ORDER BY al.id DESC LIMIT ?').all(n);
}


// ── Metrics ───────────────────────────────────────────────

export function getMetrics() {
  const totalMembers = db.prepare('SELECT COUNT(*) AS c FROM members').get().c;

  // Active members = not expired and not suspended (with VIP grace)
  const allMembers = getAllMembers();
  const activeMembers = allMembers.filter(m => m.isActive).length;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const activeToday = db.prepare(`
    SELECT COUNT(DISTINCT member_id) AS c FROM access_logs
    WHERE status = 'granted' AND timestamp >= ?
  `).get(today + 'T00:00:00').c;

  const deniedToday = db.prepare(`
    SELECT COUNT(*) AS c FROM access_logs
    WHERE status = 'denied' AND timestamp >= ?
  `).get(today + 'T00:00:00').c;

  const monthlyRevenue = allMembers
    .filter(m => m.isActive)
    .reduce((sum, m) => sum + (m.plan_price || 0), 0);

  return { totalMembers, activeMembers, activeToday, deniedToday, monthlyRevenue };
}


// ── Seed Demo Data ────────────────────────────────────────

export function seedDemoData() {
  // Only seed if db is empty
  const count = db.prepare('SELECT COUNT(*) AS c FROM members').get().c;
  if (count > 0) return false;

  const seedTransaction = db.transaction(() => {
    const seeds = [
      { name: 'Alex Johnson', email: 'alex@email.com', phone: '555-0101', tier: 'VIP' },
      { name: 'Maria Garcia', email: 'maria@email.com', phone: '555-0102', tier: 'Premium' },
      { name: 'James Wilson', email: 'james@email.com', phone: '555-0103', tier: 'Basic' },
      { name: 'Sarah Chen', email: 'sarah@email.com', phone: '555-0104', tier: 'Premium' },
      { name: 'David Kim', email: 'david@email.com', phone: '555-0105', tier: 'Basic' },
    ];

    const addedMembers = [];
    for (const s of seeds) {
      const member = addMember(s.name, s.email, s.phone, s.tier);
      addedMembers.push(member);
    }

    // Seed access logs
    const now = Date.now();
    const makeSeedLog = (member, minutesAgo, status = 'granted', reason = 'Valid membership') => {
      const ts = new Date(now - minutesAgo * 60000).toISOString();
      db.prepare(`
        INSERT INTO access_logs (member_id, member_name, plan_tier, status, reason, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(member.member_id, member.name, member.plan_tier, status, reason, ts);
    };

    makeSeedLog(addedMembers[0], 30);
    makeSeedLog(addedMembers[1], 45);

    // Denied log
    const deniedTs = new Date(now - 60 * 60000).toISOString();
    db.prepare(`
      INSERT INTO access_logs (member_id, member_name, plan_tier, status, reason, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('9999', 'Unknown', 'N/A', 'denied', 'Member ID not found', deniedTs);

    makeSeedLog(addedMembers[2], 90);
  });

  seedTransaction();
  return true;
}


// ── Enrich member row with computed fields ────────────────

function enrichMember(row) {
  const now = new Date();
  const expiry = new Date(row.expiry_date);
  let isActive = row.status !== 'suspended' && now <= expiry;

  // VIP grace period: 7 extra days
  if (!isActive && row.status !== 'suspended' && row.plan_tier === 'VIP') {
    const grace = new Date(expiry);
    grace.setDate(grace.getDate() + 7);
    isActive = now <= grace;
  }

  const daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));

  const badges = { VIP: '👑 VIP', Premium: '⭐ Premium', Basic: '🏋️ Basic' };
  const displayBadge = badges[row.plan_tier] || '🏋️ Basic';

  return {
    ...row,
    plan_perks: row.plan_perks ? JSON.parse(row.plan_perks) : [],
    isActive,
    daysRemaining,
    displayBadge
  };
}


// ── Cleanup on process exit ───────────────────────────────

process.on('exit', () => db.close());
process.on('SIGINT', () => { db.close(); process.exit(0); });
process.on('SIGTERM', () => { db.close(); process.exit(0); });

export default db;
