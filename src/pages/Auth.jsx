import { useState } from 'react';
import { useToast } from '../components/Toast';

export default function Auth({ onLogin }) {
  const showToast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please enter both username and password', 'warning');
      return;
    }

    try {
      const res = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUsername', data.username);
      showToast(`Welcome back, ${data.username}!`, 'success');
      onLogin(data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div className="logo-icon" style={{ marginBottom: '16px', fontSize: '36px', width: '56px', height: '56px' }}>
            <span className="material-symbols-outlined">shield_person</span>
          </div>
        </div>
        <h2 className="view-title" style={{ textAlign: 'center', marginBottom: '8px', fontSize: '1.8rem' }}>GymFlow Admin</h2>
        <p className="view-subtitle" style={{ textAlign: 'center', marginBottom: '32px' }}>
          Sign in to access the control panel
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="e.g. admin"
              required 
              autoFocus 
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
          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', padding: '14px' }}>
            Login to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
