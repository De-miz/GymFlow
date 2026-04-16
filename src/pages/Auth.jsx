import { useState } from 'react';
import { useToast } from '../components/Toast';

export default function Auth({ onLogin }) {
  const showToast = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please enter both username and password', 'warning');
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      showToast('Passwords do not match!', 'warning');
      return;
    }

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (isLogin) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUsername', data.username);
        showToast(`Welcome back, ${data.username}!`, 'success');
        onLogin(data);
      } else {
        showToast('Registration successful! You can now log in.', 'success');
        setIsLogin(true);
        setPassword(''); // require them to re-enter
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div className="logo-icon" style={{ marginBottom: '16px', fontSize: '36px', width: '56px', height: '56px' }}>
            <span className="material-symbols-outlined">fitness_center</span>
          </div>
        </div>
        <h2 className="view-title" style={{ textAlign: 'center', marginBottom: '8px', fontSize: '1.8rem' }}>GymFlow Admin</h2>
        <p className="view-subtitle" style={{ textAlign: 'center', marginBottom: '32px' }}>
          {isLogin ? 'Sign in to access the control panel' : 'Create a new administrator account'}
        </p>

        <div style={{ display: 'flex', marginBottom: '32px', borderBottom: '1px solid var(--border-subtle)' }}>
          <button 
            style={{ flex: 1, padding: '12px', fontWeight: '600', borderBottom: isLogin ? '2px solid var(--accent-1)' : '2px solid transparent', color: isLogin ? 'var(--text-primary)' : 'var(--text-muted)' }}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            style={{ flex: 1, padding: '12px', fontWeight: '600', borderBottom: !isLogin ? '2px solid var(--accent-1)' : '2px solid transparent', color: !isLogin ? 'var(--text-primary)' : 'var(--text-muted)' }}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

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
          {!isLogin && (
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
          )}
          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', padding: '14px' }}>
            {isLogin ? 'Login to Dashboard' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
