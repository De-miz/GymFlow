import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/gymApi';

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [m, logs] = await Promise.all([
        api.getMetrics(),
        api.getRecentLogs(5),
      ]);
      setMetrics(m);
      setRecentLogs(logs);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <section className="view active" id="view-dashboard">
      <div className="view-header">
        <h2 className="view-title">Dashboard</h2>
        <p className="view-subtitle">Overview of your gym operations</p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          icon={<span className="material-symbols-outlined">group</span>}
          value={metrics?.totalMembers ?? 0}
          label="Total Members"
          id="card-total"
        />
        <MetricCard
          icon={<span className="material-symbols-outlined">check_circle</span>}
          value={metrics?.activeToday ?? 0}
          label="Active Today"
          id="card-active"
        />
        <MetricCard
          icon={<span className="material-symbols-outlined">cancel</span>}
          value={metrics?.deniedToday ?? 0}
          label="Denied Today"
          id="card-denied"
        />
        <MetricCard
          icon={<span className="material-symbols-outlined">payments</span>}
          value={metrics?.monthlyRevenue ?? 0}
          label="Monthly Revenue"
          isCurrency
          id="card-revenue"
        />
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel">
          <h3 className="section-title"><span className="material-symbols-outlined">assignment</span> Recent Activity</h3>
          <RecentActivity logs={recentLogs} />
        </div>
        <div className="glass-panel">
          <h3 className="section-title"><span className="material-symbols-outlined">bolt</span> Quick Actions</h3>
          <div className="quick-actions-grid">
            <button
              className="btn btn-primary btn-block"
              id="btnQuickRegister"
              onClick={() => navigate('/register')}
            >
              <span className="material-symbols-outlined">person_add</span> Register New Member
            </button>
            <button
              className="btn btn-secondary btn-block"
              id="btnQuickCheckin"
              onClick={() => navigate('/checkin')}
            >
              <span className="material-symbols-outlined">how_to_reg</span> Quick Check-in
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Animated Counter Card ──────────────────────────────── */

function MetricCard({ icon, value, label, isCurrency = false, id }) {
  const ref = useRef(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const startVal = prevValue.current;
    const endVal = value;
    prevValue.current = endVal;

    const duration = 800;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = Math.round(startVal + (endVal - startVal) * eased);
      el.textContent = isCurrency
        ? `GHS ${current.toLocaleString()}`
        : current.toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value, isCurrency]);

  return (
    <div className="metric-card" id={id}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-value" ref={ref}>
        {isCurrency ? `GHS ${value.toLocaleString()}` : value}
      </div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

/* ── Recent Activity Feed ───────────────────────────────── */

function RecentActivity({ logs }) {
  if (!logs.length) {
    return <p className="empty-state">No recent activity</p>;
  }

  return logs.map((log) => (
    <div className="activity-item" key={log.id}>
      <div className={`activity-status activity-${log.status}`}>
        {log.status === 'granted' ? <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>check</span> : <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>}
      </div>
      <div className="activity-info">
        <span className="activity-name">{log.member_name}</span>
        <span className="activity-detail">{log.reason}</span>
      </div>
      <span className="activity-time">{fmtTime(log.timestamp)}</span>
    </div>
  ));
}

/* ── Helpers ────────────────────────────────────────────── */

function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
