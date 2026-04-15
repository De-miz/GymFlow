import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/gymApi';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');

  const loadLogs = useCallback(async () => {
    try {
      const data = await api.getLogs(filter);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  }, [filter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <section className="view active" id="view-logs">
      <div className="view-header">
        <h2 className="view-title">Access Logs</h2>
        <p className="view-subtitle">Timestamped history of all access attempts</p>
      </div>

      <div className="glass-panel">
        <div className="logs-header">
          <h3 className="section-title"><span className="material-symbols-outlined">history_edu</span> Log History</h3>
          <select
            className="log-filter"
            id="logFilter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Entries</option>
            <option value="granted">Granted Only</option>
            <option value="denied">Denied Only</option>
          </select>
        </div>
        <div className="table-container">
          <table className="data-table" id="logsTable">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Member ID</th>
                <th>Name</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody id="logsTableBody">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No access logs recorded
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{fmtDateTime(log.timestamp)}</td>
                    <td>
                      <span className="member-id">{log.member_id}</span>
                    </td>
                    <td>{log.member_name}</td>
                    <td>
                      <span className="badge" style={{ '--plan-color': log.plan_color || 'var(--text-muted)' }}>
                        {log.plan_tier}
                      </span>
                    </td>
                    <td>
                      <span className={`log-status log-status-${log.status}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {log.status === 'granted' ? <><span className="material-symbols-outlined" style={{fontSize:'1rem'}}>check</span> Granted</> : <><span className="material-symbols-outlined" style={{fontSize:'1rem'}}>close</span> Denied</>}
                      </span>
                    </td>
                    <td>{log.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function fmtDateTime(d) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
