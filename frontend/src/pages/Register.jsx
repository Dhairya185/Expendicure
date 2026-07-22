import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
    <div className="auth-container" style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <Card>
        <CardHeader>
          <CardTitle>Register for Expendicure</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Student ID (e.g. STU003)</label>
              <Input
                type="text"
                name="student_id_str"
                value={formData.student_id_str}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-actions" style={{ flexDirection: 'column' }}>
              <Button type="submit" loading={loading} style={{ width: '100%' }}>
                Register
              </Button>
              <p style={{ textAlign: 'center', margin: '1rem 0' }}>
                Already have an account? <Link to="/login" style={{ color: '#0088FE' }}>Login</Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
