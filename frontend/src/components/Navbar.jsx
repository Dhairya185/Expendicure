import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Clock,
  Sparkles,
  LogOut,
  ChevronDown,
  Layers,
  BarChart2,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import api from '../api/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Fetch pending SMS count every 30 seconds for the badge
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const res = await api.get('/sms-transactions/stats');
        setPendingCount(res.data.pending_count || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="navbar-wrapper">
      <nav className="navbar">
        <div className="navbar-content">
          {/* Brand & Studio Subtitle */}
          <div className="navbar-left">
            <Link to={user ? "/dashboard" : "/"} className="navbar-brand-container">
              <div className="brand-logo-icon">
                <Sparkles size={16} />
              </div>
              <div className="brand-text-stack">
                <span className="brand-title">Expendicure</span>
                <span className="brand-subtitle">UPI &amp; Wealth Studio</span>
              </div>
            </Link>

            {/* Core Primary Navigation */}
            {user && (
              <div className="navbar-nav-links">
                <Link to="/dashboard" className={`nav-tab ${isActive('/dashboard')}`}>
                  Overview
                </Link>
                <Link to="/transactions" className={`nav-tab ${isActive('/transactions')}`}>
                  Transactions
                </Link>
                <Link to="/budget" className={`nav-tab ${isActive('/budget')}`}>
                  Budgets
                </Link>
                <Link to="/analytics" className={`nav-tab ${isActive('/analytics')}`}>
                  Insights
                </Link>
                
                {/* Secondary tools (Reports, Categories, Pending) */}
                <div className="nav-dropdown-wrapper">
                  <button
                    type="button"
                    className={`nav-tab nav-tab-dropdown ${['/reports', '/categories'].includes(location.pathname) ? 'active' : ''}`}
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    onBlur={() => setTimeout(() => setShowMoreMenu(false), 200)}
                  >
                    Tools <ChevronDown size={13} />
                  </button>
                  {showMoreMenu && (
                    <div className="nav-dropdown-menu">
                      <Link to="/reports" className="nav-dropdown-item">
                        <BarChart2 size={15} /> Reports &amp; Exports
                      </Link>
                      <Link to="/categories" className="nav-dropdown-item">
                        <SlidersHorizontal size={15} /> Categories Manager
                      </Link>
                    </div>
                  )}
                </div>

                {/* Pending SMS Review link */}
                <Link
                  to="/pending-review"
                  className={`nav-tab pending-nav-pill ${isActive('/pending-review')}`}
                  title="Transactions pending approval"
                >
                  <Clock size={13} />
                  <span>Review</span>
                  {pendingCount > 0 && (
                    <span className="pending-badge-count">{pendingCount}</span>
                  )}
                </Link>
              </div>
            )}
          </div>

          {/* Right Header Elements */}
          {user ? (
            <div className="navbar-right">
              {/* Dynamic Transaction Sync Indicator */}
              <div
                className="sync-status-badge"
                title={pendingCount > 0 ? `${pendingCount} pending transactions to review` : "Transaction ingestion pipeline ready"}
              >
                <span className={`sync-dot ${pendingCount > 0 ? 'sync-dot-pending' : 'sync-dot-active'}`}></span>
                <span className="sync-text">
                  {pendingCount > 0 ? `${pendingCount} To Sync` : 'Sync Active'}
                </span>
              </div>

              {/* Notification icon link */}
              <Link
                to="/pending-review"
                className="nav-icon-btn"
                title={pendingCount > 0 ? `${pendingCount} notifications` : "No pending alerts"}
              >
                <Bell size={17} />
                {pendingCount > 0 && <span className="notification-dot"></span>}
              </Link>

              {/* User Profile / Avatar */}
              <div className="user-profile-widget">
                <div className="user-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="user-info-text">
                  <span className="user-name">{user.name || 'Student'}</span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="btn-logout-minimal"
                title="Sign out of Expendicure"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="navbar-right">
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;