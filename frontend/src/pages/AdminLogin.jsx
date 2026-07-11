import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowLeft, Eye, EyeOff, Shield, Lock, User } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-root">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-overlay" />

      <div className="admin-login-container">
        {/* Back button */}
        <button className="reg-back-btn" onClick={() => navigate('/')} style={{ marginBottom: '2rem' }}>
          <ArrowLeft size={16} />
          Back to Home
        </button>

        <div className="admin-login-card">
          {/* Card header */}
          <div className="admin-login-header">
            <div className="admin-login-logo">
              <Shield size={28} className="text-white" />
            </div>
            <div className="admin-login-logo-ring" />
            <h1 className="admin-login-title">Admin Portal</h1>
            <p className="admin-login-subtitle">Sign in to manage the allocation system</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="login-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="reg-field">
              <label className="reg-label">
                <User size={13} /> Username
              </label>
              <div className="input-icon-wrap">
                <input
                  className="reg-input"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="reg-field" style={{ marginTop: '1rem' }}>
              <label className="reg-label">
                <Lock size={13} /> Password
              </label>
              <div className="input-icon-wrap">
                <input
                  className="reg-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-eye-btn"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="reg-submit-btn"
              style={{ marginTop: '1.5rem' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Sign In to Admin
                </>
              )}
            </button>
          </form>

          <div className="login-hint">
            <p>Default credentials: <strong>admin</strong> / <strong>admin123</strong></p>
          </div>
        </div>

        {/* Branding */}
        <div className="admin-login-brand">
          <GraduationCap size={16} />
          <span>Student Course Allocation System</span>
        </div>
      </div>
    </div>
  );
}
