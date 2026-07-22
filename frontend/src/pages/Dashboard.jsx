import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Statistic, StatisticLabel, StatisticValue, StatisticTrend } from '../components/ui/Statistic';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/dashboard/summary`);
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!dashboardData) return <div>No data available</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
      </div>

      <div className="stats-grid">
        <Statistic>
          <StatisticLabel>Total Balance</StatisticLabel>
          <StatisticValue>${dashboardData.total_balance.toFixed(2)}</StatisticValue>
        </Statistic>
        
        <Statistic>
          <StatisticLabel>Monthly Spending</StatisticLabel>
          <StatisticValue>${dashboardData.total_monthly_spending.toFixed(2)}</StatisticValue>
          <StatisticTrend 
            isPositive={dashboardData.total_monthly_spending < dashboardData.total_balance}
          >
            {"Under budget"}
          </StatisticTrend>
        </Statistic>
        
        <Statistic>
          <StatisticLabel>Remaining Budget</StatisticLabel>
          <StatisticValue>${dashboardData.remaining_budget.toFixed(2)}</StatisticValue>
        </Statistic>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <CardHeader>
            <CardTitle>Category-wise Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart 
              width={400} 
              height={400}
              data={dashboardData.category_wise_summary.map((item, index) => ({
                name: item.category,
                value: item.spent,
                fill: COLORS[index % COLORS.length]
              }))}
            >
              <Pie 
                dataKey="value"
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => (
                  <text 
                    x={0} 
                    y={0} 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    fontSize={12}
                    fill="#fff"
                  >
                    {name}: {percent}%
                  </text>
                )}
              >
                {dashboardData.category_wise_summary.map((item, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </CardContent>
        </div>

        <div className="chart-card">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recent_transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Merchant</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.recent_transactions.map((transaction, index) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.payment_date}</TableCell>
                      <TableCell>{transaction.merchant_name}</TableCell>
                      <TableCell>{transaction.category_name}</TableCell>
                      <TableCell>${transaction.amount}</TableCell>
                      <TableCell>{transaction.payment_method || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="no-data">No recent transactions</p>
            )}
          </CardContent>
        </div>
      </div>

      <div className="category-summary">
        <CardHeader>
          <CardTitle>Category-wise Budget Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.category_wise_summary.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Budget</TableCell>
                  <TableCell>Spent</TableCell>
                  <TableCell>Remaining</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.category_wise_summary.map((item, index) => {
                  const percentage = item.budget > 0 ? (item.spent / item.budget) * 100 : 0;
                  const status = percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'good';
                  return (
                    <TableRow key={index} className={status}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>${item.budget}</TableCell>
                      <TableCell>${item.spent}</TableCell>
                      <TableCell>${item.budget - item.spent}</TableCell>
                      <TableCell>
                        <span className={`status-badge ${status}`}>
                          {status === 'over' ? 'Over Budget' : status === 'warning' ? 'Warning' : 'On Track'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="no-data">No budget data available</p>
          )}
        </CardContent>
      </div>
    </div>
  );
};

export default Dashboard;