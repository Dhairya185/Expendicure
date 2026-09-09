import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { X, PlusCircle, IndianRupee, Tag, Calendar, CreditCard, FileText, CheckCircle2 } from 'lucide-react';

const RecordExpenseModal = ({ isOpen, onClose, onTransactionCreated }) => {
  const [formData, setFormData] = useState({
    amount: '',
    merchant_name: '',
    category_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'UPI',
    notes: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setSuccess(false);
      setError(null);
      setFormData({
        amount: '',
        merchant_name: '',
        category_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'UPI',
        notes: ''
      });
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
      if (response.data && response.data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: response.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }
    if (!formData.merchant_name.trim()) {
      setError('Please enter merchant or payee name.');
      return;
    }
    if (!formData.category_id) {
      setError('Please select a category.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        amount: parseFloat(formData.amount),
        merchant_name: formData.merchant_name.trim(),
        category_id: parseInt(formData.category_id, 10),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        notes: formData.notes.trim()
      };

      const res = await api.post('/transactions', payload);
      setSuccess(true);
      if (onTransactionCreated) {
        onTransactionCreated(res.data);
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError(err.response?.data?.error || 'Failed to record expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Record New Expense</h2>
            <p className="modal-subtitle">Log spending instantly to update your live budget & insights.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ margin: '1rem 1.5rem 0' }}>{error}</div>}
        {success && (
          <div className="alert alert-success" style={{ margin: '1rem 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>Expense recorded! Updating financial insights...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Large Amount Input */}
          <div className="form-group-hero">
            <label className="input-hero-label">Amount (₹)</label>
            <div className="input-hero-wrapper">
              <span className="input-hero-currency">₹</span>
              <input
                type="number"
                name="amount"
                className="input-hero-field"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                autoFocus
                required
                value={formData.amount}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-grid-2">
            <div className="form-group">
              <label className="form-label">
                <Tag size={14} /> Merchant / Payee
              </label>
              <input
                type="text"
                name="merchant_name"
                className="input"
                placeholder="e.g. Swiggy, Blinkit, Campus Canteen"
                required
                value={formData.merchant_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Tag size={14} /> Category
              </label>
              <select
                name="category_id"
                className="select"
                required
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="" disabled>Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-grid-2">
            <div className="form-group">
              <label className="form-label">
                <Calendar size={14} /> Payment Date
              </label>
              <input
                type="date"
                name="payment_date"
                className="input"
                required
                value={formData.payment_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <CreditCard size={14} /> Payment Method
              </label>
              <select
                name="payment_method"
                className="select"
                value={formData.payment_method}
                onChange={handleChange}
              >
                <option value="UPI">UPI / GPay / PhonePe / Paytm</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FileText size={14} /> Notes (Optional)
            </label>
            <input
              type="text"
              name="notes"
              className="input"
              placeholder="e.g. Dinner with project group"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <PlusCircle size={17} />
              {loading ? 'Saving...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordExpenseModal;
