import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Landmark, User, Mail, Hash, Lock, ArrowRight } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    student_id_str: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    const result = await register({
      name: formData.name,
      email: formData.email,
      student_id_str: formData.student_id_str,
      username: formData.username,
      password: formData.password
    });
    
    if (result.success) {
      navigate('/login');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '500px', padding: '2rem 2.5rem' }}>
        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <div className="auth-logo">
            <div className="auth-icon">
              <Landmark size={20} />
            </div>
            Expendicure
          </div>
          <h2>Create Account</h2>
          <p>Join to manage your student finances.</p>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ padding: 0, border: 'none', boxShadow: 'none', background: 'transparent' }}>
          
          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Full Name</label>
              <div className="input-icon-wrapper">
                <User className="icon-left" />
                <input
                  type="text"
                  className="input"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Username</label>
              <div className="input-icon-wrapper">
                <User className="icon-left" />
                <input
                  type="text"
                  className="input"
                  name="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Email</label>
            <div className="input-icon-wrapper">
              <Mail className="icon-left" />
              <input
                type="email"
                className="input"
                name="email"
                placeholder="student@university.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Student ID</label>
            <div className="input-icon-wrapper">
              <Hash className="icon-left" />
              <input
                type="text"
                className="input"
                name="student_id_str"
                placeholder="STU001"
                value={formData.student_id_str}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Password</label>
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
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Confirm Password</label>
              <div className="input-icon-wrapper">
                <Lock className="icon-left" />
                <input
                  type="password"
                  className="input"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          
          <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} style={{ width: '100%', padding: '0.85rem', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'} <ArrowRight size={18} />
          </button>
        </form>
        
        <div className="auth-footer" style={{ marginTop: '1rem', paddingTop: '1rem' }}>
          Already have an account? <Link to="/login" className="link-primary">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
