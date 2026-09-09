import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

const AddTransaction = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    merchant_name: '',
    category_id: '',
    payment_date: '',
    payment_method: 'Credit Card',
    notes: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/transactions', { ...formData });
      setSuccess('Transaction added successfully!');
      setTimeout(() => {
        navigate('/transactions');
      }, 1500);
    } catch (err) {
      setError('Failed to add transaction');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="main-content">
        <div className="record-expense-header">
          <h1>Record Expense</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Log a new transaction to keep your budget on track.</p>
        </div>

        <div className="card record-expense-card">
          <div className="card-content">
            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} style={{ border: 'none', padding: 0, boxShadow: 'none' }}>
              
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>Amount ($)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>$</span>
                  <input
                    type="number"
                    className="input input-large"
                    style={{ paddingLeft: '2.5rem' }}
                    name="amount"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Merchant Name</label>
                  <input
                    type="text"
                    className="input"
                    name="merchant_name"
                    placeholder="e.g. Campus Coffee"
                    value={formData.merchant_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="select"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Payment Date</label>
                  <input
                    type="date"
                    className="input"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    className="select"
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  className="textarea"
                  name="notes"
                  placeholder="Add any details here..."
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading}>
                  <PlusCircle size={18} /> {loading ? 'Saving...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTransaction;