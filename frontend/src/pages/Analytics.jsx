import React, { useState, useEffect } from 'react';
import api from '../api/api';
import {
  TrendingUp, TrendingDown, BarChart3, PieChartIcon,
  ShoppingBag, AlertCircle, RefreshCw, IndianRupee
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';

// ─── Color palette ────────────────────────────────────────────────────────────
const COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444','#0ea5e9',
  '#ec4899','#8b5cf6','#14b8a6','#f97316','#84cc16',
  '#06b6d4','#a855f7','#d946ef','#78716c','#64748b',
  '#22c55e','#e11d48'
];

// ─── Tooltip customisations ───────────────────────────────────────────────────
const CurrencyTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: ₹{Number(p.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltipCustom = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p style={{ fontWeight: 700, color: payload[0].payload.fill }}>{payload[0].name}</p>
        <p>₹{Number(payload[0].value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        <p style={{ color: '#6b7280' }}>{(payload[0].payload.percent * 100).toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="analytics-stat-card">
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ background: `${color}22`, color }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="stat-value" style={{ color }}>
        ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
      {trend !== undefined && (
        <div className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(trend).toFixed(1)}% vs last month
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Group approved SMS transactions by month (last 6 months) */
function buildMonthlyData(transactions) {
  const months = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    months[key] = { month: key, income: 0, expense: 0 };
  }

  transactions.forEach(tx => {
    const d = new Date(tx.transaction_date || tx.created_at);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!months[key]) return;
    if (tx.transaction_type === 'Income') months[key].income += Number(tx.amount);
    else months[key].expense += Number(tx.amount);
  });

  return Object.values(months);
}

/** Group by category */
function buildCategoryData(transactions) {
  const cats = {};
  transactions.forEach(tx => {
    if (tx.transaction_type !== 'Expense') return;
    const cat = tx.category || 'Uncategorized';
    cats[cat] = (cats[cat] || 0) + Number(tx.amount);
  });
  return Object.entries(cats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/** Top merchants by spend */
function buildTopMerchants(transactions) {
  const m = {};
  transactions.forEach(tx => {
    if (tx.transaction_type !== 'Expense' || !tx.merchant) return;
    m[tx.merchant] = (m[tx.merchant] || 0) + Number(tx.amount);
  });
  return Object.entries(m)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
}

// ─── Main Component ───────────────────────────────────────────────────────────
const Analytics = () => {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/sms-transactions/?status=approved');
      setData(res.data);
    } catch (err) {
      setError('Failed to load analytics data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="container"><div className="loading-state"><div className="spinner" />Loading analytics…</div></div>
  );
  if (error) return (
    <div className="container"><div className="flash-error"><AlertCircle size={15} />{error}</div></div>
  );

  // Compute derived data
  const monthlyData    = buildMonthlyData(data);
  const categoryData   = buildCategoryData(data);
  const topMerchants   = buildTopMerchants(data);

  const totalIncome  = data.filter(t => t.transaction_type === 'Income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = data.filter(t => t.transaction_type === 'Expense').reduce((s, t) => s + Number(t.amount), 0);
  const netSavings   = totalIncome - totalExpense;

  // Current month stats
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const thisMonthData = data.filter(t => {
    const d = new Date(t.transaction_date || t.created_at);
    return d.toISOString().slice(0, 7) === thisMonth;
  });
  const thisMonthExpense = thisMonthData.filter(t => t.transaction_type === 'Expense').reduce((s, t) => s + Number(t.amount), 0);
  const thisMonthIncome  = thisMonthData.filter(t => t.transaction_type === 'Income').reduce((s, t) => s + Number(t.amount), 0);

  const maxMerchantTotal = topMerchants[0]?.total || 1;

  return (
    <div className="container analytics-page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BarChart3 size={22} style={{ color: '#6366f1', marginRight: 8 }} />
            Analytics
          </h1>
          <p className="page-subtitle">Insights from your approved SMS transactions</p>
        </div>
        <button className="btn-refresh" onClick={fetchData} id="refresh-analytics">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="analytics-stats-grid">
        <StatCard label="This Month's Expense" value={thisMonthExpense} icon={TrendingDown} color="#ef4444" />
        <StatCard label="This Month's Income"   value={thisMonthIncome}  icon={TrendingUp}   color="#10b981" />
        <StatCard label="All-time Expense"      value={totalExpense}     icon={ShoppingBag}  color="#f59e0b" />
        <StatCard label="Net Savings (all-time)" value={netSavings}      icon={IndianRupee}  color={netSavings >= 0 ? '#10b981' : '#ef4444'} />
      </div>

      {/* Tab navigation */}
      <div className="analytics-tabs">
        {['overview', 'categories', 'merchants'].map(tab => (
          <button
            key={tab}
            className={`analytics-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            id={`tab-${tab}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === 'overview' && (
        <div className="analytics-grid-2">
          {/* Monthly Income vs Expense Bar Chart */}
          <div className="analytics-card wide">
            <h3 className="analytics-card-title">Monthly Income vs Expense</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend />
                <Bar dataKey="income"  name="Income"  fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Net savings area chart */}
          <div className="analytics-card wide">
            <h3 className="analytics-card-title">Cumulative Spending Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CurrencyTooltip />} />
                <Area type="monotone" dataKey="income"  name="Income"  stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Categories tab ── */}
      {activeTab === 'categories' && (
        <div className="analytics-grid-2">
          <div className="analytics-card">
            <h3 className="analytics-card-title">Expense by Category</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    outerRadius={110}
                    innerRadius={55}
                    paddingAngle={2}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltipCustom />} />
                  <Legend formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state-small">No expense data available</div>
            )}
          </div>

          <div className="analytics-card">
            <h3 className="analytics-card-title">Category Breakdown</h3>
            <div className="category-breakdown-list">
              {categoryData.map((cat, i) => {
                const pct = ((cat.value / totalExpense) * 100).toFixed(1);
                return (
                  <div key={cat.name} className="category-breakdown-row">
                    <div className="cb-left">
                      <div className="cb-dot" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="cb-name">{cat.name}</span>
                    </div>
                    <div className="cb-right">
                      <span className="cb-pct">{pct}%</span>
                      <span className="cb-amount">
                        ₹{Number(cat.value).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="cb-bar-track">
                      <div className="cb-bar-fill" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Merchants tab ── */}
      {activeTab === 'merchants' && (
        <div className="analytics-card wide">
          <h3 className="analytics-card-title">Top Merchants by Spend</h3>
          {topMerchants.length > 0 ? (
            <div className="merchant-list">
              {topMerchants.map((m, i) => {
                const pct = ((m.total / maxMerchantTotal) * 100).toFixed(1);
                return (
                  <div key={m.name} className="merchant-row">
                    <span className="merchant-rank">#{i + 1}</span>
                    <div className="merchant-info">
                      <span className="merchant-name">{m.name}</span>
                      <div className="merchant-bar-track">
                        <div
                          className="merchant-bar-fill"
                          style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                    <span className="merchant-total">
                      ₹{Number(m.total).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state-small">No merchant data available</div>
          )}
        </div>
      )}

      {data.length === 0 && (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <BarChart3 size={48} color="#6b7280" />
          <h3>No data yet</h3>
          <p>Approve some SMS transactions in the Pending Review page to see analytics here.</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
