import { useState, useEffect } from 'react';
import * as api from '../api/gymApi';
import { useToast } from '../components/Toast';

export default function RegisterAdmin() {
  const showToast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [admins, setAdmins] = useState([]);

  const loadAdmins = async () => {
    try {
      const data = await api.getAdmins();
      setAdmins(data);
    } catch (err) {
      showToast('Failed to load system administrators', 'error');
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please enter both username and password', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match!', 'warning');
      return;
    }

    try {
      await api.registerAdmin(username, password);
      showToast('System Administrator successfully registered!', 'success');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      loadAdmins();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <section className="view active">
      <div className="view-header">
        <h2 className="view-title">Register Administrator</h2>
        <p className="view-subtitle">Create a new authenticated system administrator account</p>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel">
          <h3 className="section-title"><span className="material-symbols-outlined">person_add</span> Create Account</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="e.g. system_admin"
                required 
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>
            <div>
              <label className="form-label">Confirm Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', padding: '14px' }}>
              Register Administrator
            </button>
          </form>
        </div>

        <div className="glass-panel">
          <h3 className="section-title"><span className="material-symbols-outlined">admin_panel_settings</span> System Administrators</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Registered On</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id}>
                    <td style={{ fontWeight: 600 }}>
                      {admin.username}
                      {admin.username === localStorage.getItem('adminUsername') && (
                        <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--accent-1)' }}>(You)</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(admin.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No administrators found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
