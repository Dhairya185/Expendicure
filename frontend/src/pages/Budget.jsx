import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/Table';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    category_id: '',
    monthly_limit: '',
    month: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  useEffect(() => {
    fetchCategories();
    fetchBudgets();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchBudgets = async () => {
    try {
      const response = await api.get(`/budgets`);
      setBudgets(response.data);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Check if we are updating or creating
      const existingBudget = budgets.find(b => 
        b.category_id === Number(formData.category_id) && 
        b.month === formData.month
      );

      if (existingBudget) {
        // Update existing budget
        await api.put(`/budgets`, {
          category_id: formData.category_id,
          monthly_limit: formData.monthly_limit,
          month: formData.month
        });
        setSuccess('Budget updated successfully!');
      } else {
        // Create new budget
        await api.post(`/budgets`, {
          category_id: formData.category_id,
          monthly_limit: formData.monthly_limit,
          month: formData.month
        });
        setSuccess('Budget added successfully!');
      }
      // Refresh budgets
      fetchBudgets();
      // Reset form (except student_id and month)
      setFormData(prev => ({
        ...prev,
        category_id: '',
        monthly_limit: ''
      }));
    } catch (err) {
      setError('Failed to save budget');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="budget-page">
      <div className="page-header">
        <h1>Budget Management</h1>
        <div className="controls">
          <div className="month-selector">
            <label>Month: </label>
            <Input
              type="month"
              value={formData.month || getCurrentMonth()}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Set Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="category_id">Category</label>
              <Select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="form-group">
              <label htmlFor="monthly_limit">Monthly Limit ($)</label>
              <Input
                type="number"
                name="monthly_limit"
                value={formData.monthly_limit}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-actions">
              <Button type="submit" loading={loading}>
                Save Budget
              </Button>
              <Button type="button" variant="outline" onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  category_id: '',
                  monthly_limit: ''
                }));
              }}>
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          {budgets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Monthly Limit</TableCell>
                  <TableCell>Month</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell>{budget.category_name}</TableCell>
                    <TableCell>${budget.monthly_limit}</TableCell>
                    <TableCell>{budget.month}</TableCell>
                    <TableCell className="actions">
                      {/* Note: We don't have a delete endpoint for budgets in the backend, but we can add one if needed.
                          For now, we'll just show that we can edit by resetting the form with this budget's data. */}
                      <Button 
                        variant="outline" 
                        size="small"
                        onClick={() => {
                          setFormData({
                            category_id: budget.category_id,
                            monthly_limit: budget.monthly_limit,
                            month: budget.month
                          });
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="no-data">No budgets set for this student and month.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Budget;