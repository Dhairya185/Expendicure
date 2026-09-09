import React, { useState, useEffect } from "react";
import api from "../api/api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";


const CATEGORY_COLORS = [
  "#027a48",
  "#0ea5e9",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

const getCategoryColor = (index) => CATEGORY_COLORS[index % CATEGORY_COLORS.length];

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div style={{
        background: "white", border: "1px solid #e2e8e4", borderRadius: "10px",
        padding: "10px 16px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "0.85rem"
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: entry.payload.fill }}>{entry.name}</div>
        <div style={{ color: "#5a6660" }}>Amount: <strong>${entry.value.toFixed(2)}</strong></div>
        <div style={{ color: "#5a6660" }}>Share: <strong>{(entry.payload.percent * 100).toFixed(1)}%</strong></div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "white", border: "1px solid #e2e8e4", borderRadius: "10px",
        padding: "10px 16px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "0.85rem"
      }}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: "#1a1f1c" }}>{label}</div>
        {payload.map((entry, i) => (
          <div key={i} style={{ color: entry.color, display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: entry.color }} />
            {entry.name}: <strong>${Number(entry.value).toFixed(2)}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const renderCustomLegend = (pieData) => (
  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 20px", marginTop: "12px" }}>
    {pieData.map((entry, index) => (
      <div key={index} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#5a6660" }}>
        <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: getCategoryColor(index), flexShrink: 0 }} />
        {entry.name}
      </div>
    ))}
  </div>
);

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: "", start_date: "", end_date: "", month: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  useEffect(() => {
    fetchCategories();
    fetchReportData();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.start_date) queryParams.append("start_date", filters.start_date);
      if (filters.end_date) queryParams.append("end_date", filters.end_date);
      if (filters.month) queryParams.append("month", filters.month);
      const response = await api.get(`/reports/chart-data?${queryParams.toString()}`);
      setReportData(response.data);
    } catch (err) {
      setError("Failed to load report data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({ category: "", start_date: "", end_date: "", month: "" });
  };

  const activePieData = reportData?.pie_chart?.filter(item => item.value > 0) ?? [];
  const barData = reportData?.bar_chart ?? [];

  const categoryColorMap = {};
  activePieData.forEach((item, index) => { categoryColorMap[item.name] = getCategoryColor(index); });

  if (loading) return (
    <div className="container">
      <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>Loading reports...</div>
    </div>
  );
  if (error) return (
    <div className="container">
      <div style={{ padding: "4rem", textAlign: "center", color: "var(--error-text)" }}>{error}</div>
    </div>
  );

  return (
    <div className="container">
      <div className="main-content">
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            Reports &amp; Analytics
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Visualize your spending patterns across categories and time periods.
          </p>
        </div>

        <div className="card" style={{ marginBottom: "1.5rem", padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "160px" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>Category</label>
              <Select name="category" value={filters.category} onChange={handleChange}>
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </Select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "160px" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>Month</label>
              <Input type="month" name="month" value={filters.month || getCurrentMonth()} onChange={handleChange} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "140px" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>Start Date</label>
              <Input type="date" name="start_date" value={filters.start_date} onChange={handleChange} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "140px" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>End Date</label>
              <Input type="date" name="end_date" value={filters.end_date} onChange={handleChange} />
            </div>
            <Button variant="outline" onClick={handleReset} style={{ alignSelf: "flex-end" }}>
              Reset Filters
            </Button>
          </div>
        </div>

        {!reportData && (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>No data available</div>
        )}

        {reportData && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Category-wise Spending</h3>
                </div>
                <div className="card-content" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {activePieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={activePieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                            innerRadius={55}
                            paddingAngle={2}
                            labelLine={false}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                              if (percent < 0.04) return null;
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              return (
                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
                                  {`${(percent * 100).toFixed(0)}%`}
                                </text>
                              );
                            }}
                          >
                            {activePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getCategoryColor(index)} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      {renderCustomLegend(activePieData)}
                    </>
                  ) : (
                    <div style={{ padding: "3rem", color: "var(--text-muted)", textAlign: "center" }}>
                      No spending data for selected filters
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Monthly Spending Trend</h3>
                </div>
                <div className="card-content">
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#edf2ef" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5a6660" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#5a6660" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(2,122,72,0.06)" }} />
                        <Bar dataKey="value" name="Spending" radius={[6, 6, 0, 0]} maxBarSize={56}>
                          {barData.map((entry, index) => (
                            <Cell
                              key={`bar-cell-${index}`}
                              fill={filters.category ? (categoryColorMap[filters.category] || CATEGORY_COLORS[0]) : getCategoryColor(index)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ padding: "3rem", color: "var(--text-muted)", textAlign: "center" }}>No monthly data available</div>
                  )}
                </div>
              </div>
            </div>

            {activePieData.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                {activePieData.slice(0, 5).map((item, index) => {
                  const total = activePieData.reduce((sum, d) => sum + d.value, 0);
                  const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={index} className="card" style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: getCategoryColor(index), display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>{item.name}</span>
                      </div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>${item.value.toFixed(2)}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{pct}% of total</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Filtered Transactions</h3>
              </div>
              <div className="card-content" style={{ padding: 0 }}>
                {reportData.recent_transactions.length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Merchant</th>
                          <th>Category</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.recent_transactions.map((transaction) => {
                          const catIdx = activePieData.findIndex(p => p.name === transaction.category);
                          const catColor = catIdx >= 0 ? getCategoryColor(catIdx) : "#8b9992";
                          return (
                            <tr key={transaction.id}>
                              <td style={{ color: "var(--text-secondary)" }}>{transaction.payment_date}</td>
                              <td style={{ fontWeight: 500 }}>{transaction.merchant_name}</td>
                              <td>
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 5,
                                  background: `${catColor}18`, color: catColor,
                                  borderRadius: 20, padding: "2px 10px", fontSize: "0.78rem", fontWeight: 600
                                }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: catColor, display: "inline-block" }} />
                                  {transaction.category}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>${Number(transaction.amount).toFixed(2)}</td>
                              <td style={{ color: "var(--text-secondary)" }}>{transaction.payment_method || "-"}</td>
                              <td style={{ color: "var(--text-muted)" }}>{transaction.notes || "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No transactions match the current filters.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
