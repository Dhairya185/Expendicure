import React, { useState } from 'react';
import api from '../api/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const AddTransaction = () => {
  const [formData, setFormData] = useState({
    amount: '',
    merchant_name: '',
    category_id: '',
    payment_date: '',
    payment_method: '',
    notes: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch categories when component mounts
  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
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
      const response = await api.post('/transactions', {
        ...formData
      });
      setSuccess('Transaction added successfully!');
      // Reset form
      setFormData({
        amount: '',
        merchant_name: '',
        category_id: '',
        payment_date: '',
        payment_method: '',
        notes: ''
      });
    } catch (err) {
      setError('Failed to add transaction');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-transaction-page">
      <div className="page-header">
        <h1>Add Transaction</h1>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="amount">Amount ($)</label>
              <Input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="merchant_name">Merchant Name</label>
              <Input
                type="text"
                name="merchant_name"
                value={formData.merchant_name}
                onChange={handleChange}
                required
              />
            </div>

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
              <label htmlFor="payment_date">Payment Date</label>
              <Input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="payment_method">Payment Method</label>
              <Select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
              >
                <option value="">Select payment method</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (optional)</label>
              <Input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <Button type="submit" loading={loading}>
                Add Transaction
              </Button>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTransaction;