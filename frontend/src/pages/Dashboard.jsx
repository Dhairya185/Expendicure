import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { queryFinancialCopilot } from '../api/aiService';
import { useAuth } from '../context/AuthContext';
import RecordExpenseModal from '../components/RecordExpenseModal';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  ArrowUpRight,
  Utensils,
  GraduationCap,
  Train,
  Coffee,
  FileText,
  CreditCard,
  ArrowRightLeft,
  Sparkles,
  Send,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Info,
  DollarSign
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

// Helper to get icon for category
const getCategoryIcon = (categoryName) => {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('food') || name.includes('dining') || name.includes('groceries')) return <Utensils size={16} />;
  if (name.includes('education') || name.includes('books') || name.includes('fees')) return <GraduationCap size={16} />;
  if (name.includes('travel') || name.includes('transport') || name.includes('fuel')) return <Train size={16} />;
  if (name.includes('coffee') || name.includes('cafe') || name.includes('snack')) return <Coffee size={16} />;
  return <FileText size={16} />;
};

// Tooltip for Spending Rhythm chart
const SpendingRhythmTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rhythm-tooltip">
        <div className="tooltip-date">{label}</div>
        <div className="tooltip-amount">
          ₹{Number(payload[0].value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <div className="tooltip-sub">Outflow</div>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Quick Record Expense Modal state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Spending Rhythm timeframe filter: 'week' | 'month' | 'year'
  const [rhythmFilter, setRhythmFilter] = useState('week');

  // Financial Copilot query state
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState(null);

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/summary');
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopilotSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!copilotQuery.trim()) return;

    setCopilotLoading(true);
    try {
      const data = await queryFinancialCopilot(copilotQuery);
      setCopilotResult(data.evaluation);
    } catch (err) {
      console.error('Failed to query copilot:', err);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    setCopilotQuery(promptText);
    setCopilotLoading(true);
    queryFinancialCopilot(promptText)
      .then((data) => {
        setCopilotResult(data.evaluation);
      })
      .catch((err) => {
        console.error('Error on quick prompt:', err);
      })
      .finally(() => {
        setCopilotLoading(false);
      });
  };

  // Get dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="spinner"></div>
        <p>Loading your financial studio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '3rem' }}>
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <div>{error}</div>
          <button className="btn btn-outline btn-sm" onClick={() => fetchDashboardData()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const {
    available_balance = 0,
    total_monthly_spending = 0,
    total_budget = 0,
    remaining_budget = 0,
    budget_utilization_pct = 0,
    days_remaining = 1,
    spend_trend_pct = 0,
    daily_burn_rate = 0,
    recommended_daily_budget = 0,
    category_wise_summary = [],
    recent_transactions = [],
    spending_rhythm = { week: [], month: [], year: [] },
    spending_insight = null,
    payment_methods = [],
    pending_sms_count = 0,
    recent_sms_transactions = []
  } = dashboardData;

  // Chart data based on selected rhythm filter
  const currentChartData = spending_rhythm[rhythmFilter] || spending_rhythm.week || [];

  // Pacing status calculation
  const isBudgetOver = total_budget > 0 && total_monthly_spending > total_budget;
  const isBudgetWarning = total_budget > 0 && budget_utilization_pct >= 80 && !isBudgetOver;

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Pending Review Alert Banner if pending SMS exist */}
        {pending_sms_count > 0 && (
          <div className="pending-alert-banner">
            <div className="pending-alert-left">
              <Clock size={18} className="pending-icon" />
              <div>
                <strong>{pending_sms_count} new transaction{pending_sms_count > 1 ? 's' : ''} captured</strong>
                <span> — Review and categorize to update your live budget limits.</span>
              </div>
            </div>
            <Link to="/pending-review" className="btn-pending-action">
              Review Transactions →
            </Link>
          </div>
        )}

        {/* 1. Dashboard Header */}
        <div className="dashboard-header-row">
          <div className="header-greeting-block">
            <h1 className="greeting-title">
              {getGreeting()}, <span className="greeting-name">{user?.name || 'Student'}</span>
            </h1>
            <p className="greeting-subtitle">
              Your financial accounts and spending are up to date.
            </p>
          </div>

          <div className="header-actions">
            <button
              className={`btn-header-action btn-refresh ${refreshing ? 'is-refreshing' : ''}`}
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              title="Refresh financial data"
            >
              <RefreshCw size={15} />
              <span>{refreshing ? 'Syncing...' : 'Refresh Data'}</span>
            </button>

            <button
              className="btn-header-action btn-record-expense"
              onClick={() => setIsRecordModalOpen(true)}
            >
              <Plus size={16} />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        {/* 2. Top Summary Cards Grid */}
        <div className="summary-cards-grid">
          {/* Card 1: Available Balance */}
          <div className="fin-card balance-card">
            <div className="fin-card-header">
              <span className="fin-card-label">AVAILABLE BALANCE</span>
              <div className="trend-badge-pill">
                {spend_trend_pct <= 0 ? (
                  <span className="trend-positive">
                    <TrendingDown size={13} /> {Math.abs(spend_trend_pct)}% vs last mo
                  </span>
                ) : (
                  <span className="trend-neutral">
                    <TrendingUp size={13} /> +{spend_trend_pct}% vs last mo
                  </span>
                )}
              </div>
            </div>

            <div className="fin-card-main-val">
              ₹{Number(available_balance).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>

            <div className="fin-card-meta-row">
              <div className="burn-indicator">
                <span className="meta-label">Daily Burn Pace:</span>
                <span className="meta-val">₹{daily_burn_rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/day</span>
              </div>
            </div>

            {/* Account/Source distribution tags */}
            <div className="account-pills-row">
              {payment_methods.length > 0 ? (
                payment_methods.slice(0, 3).map((pm, idx) => (
                  <span key={idx} className="account-tag">
                    {pm.method} • ₹{Number(pm.total).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                ))
              ) : (
                <span className="account-tag">UPI &amp; Banking Connected</span>
              )}
            </div>
          </div>

          {/* Card 2: Monthly Budget Card */}
          <div className="fin-card budget-summary-card">
            <div className="fin-card-header">
              <span className="fin-card-label">MONTHLY BUDGET</span>
              <span className={`budget-status-pill ${isBudgetOver ? 'status-over' : isBudgetWarning ? 'status-warning' : 'status-healthy'}`}>
                {budget_utilization_pct}% used
              </span>
            </div>

            <div className="budget-progress-container">
              <div className="budget-values-row">
                <div className="budget-spent-stack">
                  <span className="budget-num-label">Spent</span>
                  <span className="budget-num-val">
                    ₹{Number(total_monthly_spending).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="budget-total-stack">
                  <span className="budget-num-label">Limit</span>
                  <span className="budget-num-val">
                    ₹{Number(total_budget).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Multi-shade Progress bar */}
              <div className="progress-bar-track">
                <div
                  className={`progress-bar-fill ${isBudgetOver ? 'fill-danger' : isBudgetWarning ? 'fill-warning' : 'fill-primary'}`}
                  style={{ width: `${Math.min(budget_utilization_pct, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="budget-footer-row">
              <div className="budget-left-pill">
                <strong>₹{Number(remaining_budget).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                <span> left</span>
              </div>
              <div className="budget-days-pill">
                <Calendar size={13} />
                <span>{days_remaining} day{days_remaining > 1 ? 's' : ''} remaining</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Wide Spending Insight Banner */}
        {spending_insight && (
          <div className={`insight-banner insight-banner-${spending_insight.severity || 'normal'}`}>
            <div className="insight-banner-left">
              <div className="insight-badge">
                <Sparkles size={14} />
                <span>SPENDING INSIGHT · {spending_insight.category || 'General'}</span>
              </div>
              <h3 className="insight-title">{spending_insight.title}</h3>
              <p className="insight-message">{spending_insight.message}</p>
              {spending_insight.subtext && (
                <p className="insight-subtext">{spending_insight.subtext}</p>
              )}
            </div>

            <div className="insight-banner-right">
              <Link to={spending_insight.action_link || '/budget'} className="btn-insight-action">
                {spending_insight.action_text || 'View Details'} →
              </Link>
            </div>
          </div>
        )}

        {/* 4. Middle Grid: Spending Rhythm + Category Budgets */}
        <div className="dashboard-grid-2">
          {/* Spending Rhythm Card */}
          <div className="card rhythm-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Spending Rhythm</h3>
                <p className="card-subtitle">
                  {rhythmFilter === 'week'
                    ? 'Daily UPI outflows for the past 7 days'
                    : rhythmFilter === 'month'
                    ? 'Daily outflows over the past 30 days'
                    : 'Monthly outflow trends over past year'}
                </p>
              </div>

              {/* Timeframe Filter Tabs */}
              <div className="filter-pill-group">
                <button
                  className={`filter-pill ${rhythmFilter === 'week' ? 'active' : ''}`}
                  onClick={() => setRhythmFilter('week')}
                >
                  Week
                </button>
                <button
                  className={`filter-pill ${rhythmFilter === 'month' ? 'active' : ''}`}
                  onClick={() => setRhythmFilter('month')}
                >
                  Month
                </button>
                <button
                  className={`filter-pill ${rhythmFilter === 'year' ? 'active' : ''}`}
                  onClick={() => setRhythmFilter('year')}
                >
                  Year
                </button>
              </div>
            </div>

            <div className="rhythm-chart-wrapper">
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={currentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rhythmGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<SpendingRhythmTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#rhythmGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Budgets Card */}
          <div className="card category-budgets-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Category Budgets</h3>
                <p className="card-subtitle">Limits and utilization for this month</p>
              </div>
              <Link to="/budget" className="card-action-link">
                Edit limits
              </Link>
            </div>

            <div className="category-budgets-list">
              {category_wise_summary.length > 0 ? (
                category_wise_summary.slice(0, 5).map((cat, idx) => {
                  const isOver = cat.spent > cat.budget && cat.budget > 0;
                  const buffer = cat.budget - cat.spent;
                  return (
                    <div key={idx} className="category-budget-row">
                      <div className="cat-row-top">
                        <div className="cat-name-group">
                          <div className="cat-icon-bubble">
                            {getCategoryIcon(cat.category)}
                          </div>
                          <span className="cat-name-text">{cat.category}</span>
                        </div>

                        <div className="cat-amount-group">
                          <span className="cat-spent-text">
                            ₹{Number(cat.spent).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                          <span className="cat-budget-divider">/</span>
                          <span className="cat-limit-text">
                            ₹{Number(cat.budget).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>

                      {/* Mini progress bar */}
                      <div className="cat-progress-track">
                        <div
                          className={`cat-progress-fill ${isOver ? 'fill-danger' : cat.utilization_pct >= 80 ? 'fill-warning' : 'fill-primary'}`}
                          style={{ width: `${Math.min(cat.utilization_pct || 0, 100)}%` }}
                        ></div>
                      </div>

                      <div className="cat-row-bottom">
                        <span className="cat-pct-text">{cat.utilization_pct}% used</span>
                        <span className={`cat-buffer-badge ${isOver ? 'buffer-over' : 'buffer-ok'}`}>
                          {isOver
                            ? `Exceeded by ₹${Math.abs(buffer).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                            : `₹${buffer.toLocaleString('en-IN', { maximumFractionDigits: 0 })} buffer`}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state-box">
                  <p>No category budgets defined yet.</p>
                  <Link to="/budget" className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem' }}>
                    Set Category Budgets
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. Bottom Grid: Recent Activity + Financial Copilot */}
        <div className="dashboard-grid-2">
          {/* Recent Activity Card */}
          <div className="card recent-activity-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Recent Activity</h3>
                <p className="card-subtitle">Auto-categorized from UPI &amp; manual logs</p>
              </div>
              <Link to="/transactions" className="card-action-link">
                View all
              </Link>
            </div>

            <div className="activity-stream">
              {recent_transactions.length > 0 ? (
                recent_transactions.slice(0, 6).map((tx) => {
                  const dateStr = tx.payment_date
                    ? new Date(tx.payment_date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Recent';

                  return (
                    <div key={tx.id} className="activity-item-row">
                      <div className="activity-left">
                        <div className="activity-avatar">
                          {getCategoryIcon(tx.category_name)}
                        </div>
                        <div className="activity-details">
                          <span className="merchant-title">{tx.merchant_name}</span>
                          <div className="activity-meta">
                            <span className="activity-category">{tx.category_name}</span>
                            <span className="meta-dot">•</span>
                            <span className="activity-date">{dateStr}</span>
                          </div>
                        </div>
                      </div>

                      <div className="activity-right">
                        <span className="activity-amount expense">
                          -₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="activity-method-badge">
                          {tx.payment_method || 'UPI'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state-box">
                  <p>No recent activity logged this month.</p>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: '0.5rem' }}
                    onClick={() => setIsRecordModalOpen(true)}
                  >
                    + Record First Expense
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Financial Copilot Card */}
          <div className="card copilot-card">
            <div className="card-header-flex">
              <div>
                <div className="copilot-badge-title">
                  <Sparkles size={16} className="copilot-sparkle-icon" />
                  <h3 className="card-title">Financial Copilot</h3>
                  <span className="student-badge">Student Intelligence</span>
                </div>
                <p className="card-subtitle">
                  Ask about affordability, weekend limits, or purchase timing
                </p>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="quick-chips-row">
              <button
                type="button"
                className="chip-btn"
                onClick={() => handleQuickPrompt('Can I afford a ₹10,000 Goa trip?')}
              >
                Goa trip (₹10k)?
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => handleQuickPrompt('How much can I spend this weekend?')}
              >
                Weekend limit?
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => handleQuickPrompt('Should I postpone this purchase?')}
              >
                Postpone purchase?
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => handleQuickPrompt('How much should I save each week?')}
              >
                Weekly savings?
              </button>
            </div>

            {/* Chat/Query Input Form */}
            <form onSubmit={handleCopilotSubmit} className="copilot-query-form">
              <input
                type="text"
                className="copilot-input"
                placeholder="Ask about your money (e.g. Can I afford a ₹5,000 laptop upgrade?)..."
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
              />
              <button
                type="submit"
                className="copilot-send-btn"
                disabled={copilotLoading || !copilotQuery.trim()}
              >
                {copilotLoading ? <RefreshCw size={15} className="is-refreshing" /> : <Send size={15} />}
              </button>
            </form>

            {/* Copilot Reasoning Output Card */}
            {copilotResult && (
              <div className="copilot-response-container">
                <div className="copilot-verdict-header">
                  <span className={`verdict-pill ${copilotResult.badge_class || 'badge-primary'}`}>
                    {copilotResult.verdict}
                  </span>
                  <span className="copilot-verdict-headline">{copilotResult.headline}</span>
                </div>

                <p className="copilot-explanation">{copilotResult.explanation}</p>

                {/* Recommendations */}
                {copilotResult.recommendations && copilotResult.recommendations.length > 0 && (
                  <ul className="copilot-recommendations-list">
                    {copilotResult.recommendations.map((rec, i) => (
                      <li key={i}>
                        <CheckCircle2 size={13} className="rec-check-icon" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Record Expense Modal */}
      <RecordExpenseModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onTransactionCreated={() => {
          fetchDashboardData(true);
        }}
      />
    </div>
  );
};

export default Dashboard;