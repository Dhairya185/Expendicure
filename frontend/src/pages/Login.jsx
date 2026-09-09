import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Landmark, User, Lock, EyeOff, ArrowRight } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-icon">
              <Landmark size={20} />
            </div>
            Expendicure
          </div>
          <h2>Welcome back</h2>
          <p>Enter your details to access your account.</p>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ padding: 0, border: 'none', boxShadow: 'none', background: 'transparent' }}>
          <div className="form-group">
            <label>Username or Email</label>
            <div className="input-icon-wrapper">
              <User className="icon-left" />
              <input
                type="text"
                className="input"
                name="username"
                placeholder="student@university.edu"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ marginBottom: 0 }}>Password</label>
              <a href="#" className="link-primary" style={{ fontSize: '0.85rem' }}>Forgot password?</a>
            </div>
            <div className="input-icon-wrapper">
              <Lock className="icon-left" />
              <input
                type="password"
                className="input"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <EyeOff className="icon-right" />
            </div>
          </div>
          
          <div className="auth-options">
            <label className="checkbox-label">
              <input type="checkbox" /> Keep me securely logged in
            </label>
          </div>
          
          <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} style={{ width: '100%', padding: '0.85rem' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'} <ArrowRight size={18} />
          </button>
        </form>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/register" className="link-primary">Register now</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
