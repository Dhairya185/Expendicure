import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    start_date: '',
    end_date: '',
    month: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  useEffect(() => {
    fetchCategories();
    fetchReportData();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);
      if (filters.month) queryParams.append('month', filters.month);
      
      const response = await api.get(`/reports/chart-data?${queryParams.toString()}`);
      setReportData(response.data);
    } catch (err) {
      setError('Failed to load report data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    setFilters({
      category: '',
      start_date: '',
      end_date: '',
      month: ''
    });
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <div className="controls">
          
          <div className="filter-group">
            <label>Category: </label>
            <Select
              name="category"
              value={filters.category}
              onChange={handleChange}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="filter-group">
            <label>Month: </label>
            <Input
              type="month"
              name="month"
              value={filters.month || getCurrentMonth()}
              onChange={handleChange}
            />
          </div>

          <div className="filter-group">
            <label>Start Date: </label>
            <Input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleChange}
            />
          </div>

          <div className="filter-group">
            <label>End Date: </label>
            <Input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleChange}
            />
          </div>

          <Button variant="outline" onClick={handleReset}>
            Reset Filters
          </Button>
        </div>
      </div>

      {!reportData && <div>No data available</div>}

      {reportData && (
        <>
          <div className="charts-row">
            <div className="chart-card">
              <CardHeader>
                <CardTitle>Category-wise Spending (Pie Chart)</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart 
                  width={400} 
                  height={400}
                  data={reportData.pie_chart.map((item, index) => ({
                    ...item,
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
                    data={reportData.pie_chart.map((item, index) => ({
                      name: item.name,
                      value: item.value,
                      fill: COLORS[index % COLORS.length]
                    }))}
                  >
                    {reportData.pie_chart.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </CardContent>
            </div>

            <div className="chart-card">
              <CardHeader>
                <CardTitle>Monthly Spending Trend (Bar Chart)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={reportData.bar_chart}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </div>
          </div>

          <div className="transactions-section">
            <CardHeader>
              <CardTitle>Filtered Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.recent_transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Merchant</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.recent_transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.payment_date}</TableCell>
                        <TableCell>{transaction.merchant_name}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>${transaction.amount}</TableCell>
                        <TableCell>{transaction.payment_method || '-'}</TableCell>
                        <TableCell>{transaction.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="no-data">No transactions match the current filters.</p>
              )}
            </CardContent>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;