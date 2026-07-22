import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          Expendicure
        </Link>
        {user ? (
          <div className="navbar-links" style={{ alignItems: 'center' }}>
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/transactions" className="nav-link">Transactions</Link>
            <Link to="/transactions/add" className="nav-link">Add Transaction</Link>
            <Link to="/budget" className="nav-link">Budget</Link>
            <Link to="/reports" className="nav-link">Reports</Link>
            <Link to="/categories" className="nav-link">Categories</Link>
            <span style={{ marginLeft: '1rem', fontWeight: 'bold' }}>Hi, {user.name}</span>
            <Button variant="outline" onClick={handleLogout} style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem' }}>Logout</Button>
          </div>
        ) : (
          <div className="navbar-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;