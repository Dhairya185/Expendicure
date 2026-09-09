import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import {
  CheckCircle2, Trash2, Edit3, X, MessageSquare,
  Clock, AlertCircle, ChevronDown, ChevronUp, IndianRupee,
  Store, Tag, RefreshCw
} from 'lucide-react';

// ─── Category options (must match backend seed) ───────────────────────────────
const CATEGORIES = [
  'Food', 'Groceries', 'Travel', 'Fuel', 'Shopping',
  'Entertainment', 'Healthcare', 'Education', 'Utilities',
  'Rent', 'Investment', 'Cash Withdrawal', 'Transfer',
  'Salary', 'Refund', 'Income', 'Uncategorized',
];

// ─── Sub-component: Edit Form (inline) ───────────────────────────────────────
function EditForm({ tx, onSave, onCancel }) {
  const [form, setForm] = useState({
    amount:   tx.amount || '',
    merchant: tx.merchant || '',
    category: tx.category || 'Uncategorized',
  });

  const handleChange = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="pending-edit-form">
      <div className="edit-row">
        <label>Amount (₹)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={form.amount}
          onChange={handleChange('amount')}
          className="edit-input"
          id={`edit-amount-${tx.id}`}
        />
      </div>
      <div className="edit-row">
        <label>Merchant</label>
        <input
          type="text"
          value={form.merchant}
          onChange={handleChange('merchant')}
          placeholder="e.g. Zomato"
          className="edit-input"
          id={`edit-merchant-${tx.id}`}
        />
      </div>
      <div className="edit-row">
        <label>Category</label>
        <select
          value={form.category}
          onChange={handleChange('category')}
          className="edit-select"
          id={`edit-category-${tx.id}`}
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="edit-actions">
        <button className="btn-save-edit" onClick={() => onSave(form)} id={`save-edit-${tx.id}`}>
          Save Changes
        </button>
        <button className="btn-cancel-edit" onClick={onCancel} id={`cancel-edit-${tx.id}`}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Sub-component: SMS Transaction Card ─────────────────────────────────────
function PendingCard({ tx, onApprove, onDelete, onEdit }) {
  const [expanded, setExpanded]   = useState(false);
  const [editing, setEditing]     = useState(false);
  const [loading, setLoading]     = useState(false);

  const isIncome = tx.transaction_type === 'Income';
  const typeColor = isIncome ? '#10b981' : '#ef4444';
  const typeBg    = isIncome ? '#d1fae5' : '#fee2e2';

  const formattedDate = tx.transaction_date
    ? new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  async function handleApprove() {
    setLoading(true);
    await onApprove(tx.id);
    setLoading(false);
  }

  async function handleDelete() {
    if (!window.confirm('Delete this SMS transaction? This cannot be undone.')) return;
    setLoading(true);
    await onDelete(tx.id);
    setLoading(false);
  }

  async function handleEditSave(edits) {
    setLoading(true);
    await onEdit(tx.id, edits);
    setEditing(false);
    setLoading(false);
  }

  return (
    <div className={`pending-card ${isIncome ? 'income-card' : 'expense-card'}`}>
      {/* Card header */}
      <div className="pending-card-header">
        <div className="pending-card-left">
          <div className="pending-type-badge" style={{ background: typeBg, color: typeColor }}>
            {isIncome ? '▲ Income' : '▼ Expense'}
          </div>
          <div className="pending-meta">
            <span className="pending-merchant">{tx.merchant || 'Unknown Merchant'}</span>
            <span className="pending-sub">{tx.sender} · {formattedDate}</span>
          </div>
        </div>

        <div className="pending-card-right">
          <span className="pending-amount" style={{ color: typeColor }}>
            {isIncome ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="pending-category-pill">{tx.category}</span>
        </div>
      </div>

      {/* Expandable raw message */}
      <button
        className="pending-expand-btn"
        onClick={() => setExpanded(v => !v)}
        id={`expand-${tx.id}`}
      >
        <MessageSquare size={13} />
        {expanded ? 'Hide' : 'Show'} raw SMS
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expanded && (
        <div className="pending-raw-message">{tx.raw_message}</div>
      )}

      {/* Edit form */}
      {editing && (
        <EditForm
          tx={tx}
          onSave={handleEditSave}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* Action buttons */}
      {!editing && (
        <div className="pending-card-actions">
          <button
            className="btn-approve"
            onClick={handleApprove}
            disabled={loading}
            id={`approve-${tx.id}`}
          >
            <CheckCircle2 size={15} />
            {loading ? 'Processing…' : 'Approve'}
          </button>
          <button
            className="btn-edit-pending"
            onClick={() => setEditing(true)}
            disabled={loading}
            id={`edit-${tx.id}`}
          >
            <Edit3 size={15} />
            Edit
          </button>
          <button
            className="btn-delete-pending"
            onClick={handleDelete}
            disabled={loading}
            id={`delete-${tx.id}`}
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const PendingReview = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [successMsg, setSuccessMsg]     = useState('');

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/sms-transactions/pending');
      setTransactions(res.data);
    } catch (err) {
      setError('Failed to load pending SMS transactions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/sms-transactions/${id}/approve`);
      setTransactions(prev => prev.filter(t => t.id !== id));
      flash('✅ Transaction approved and added to your history!');
    } catch (err) {
      setError('Failed to approve transaction.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/sms-transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
      flash('🗑️ Transaction dismissed.');
    } catch (err) {
      setError('Failed to delete transaction.');
    }
  };

  const handleEdit = async (id, edits) => {
    try {
      const res = await api.put(`/sms-transactions/${id}`, edits);
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...res.data } : t));
      flash('✏️ Transaction updated.');
    } catch (err) {
      setError('Failed to update transaction.');
    }
  };

  const approveAll = async () => {
    if (!window.confirm(`Approve all ${transactions.length} pending transactions?`)) return;
    for (const tx of transactions) {
      try { await api.put(`/sms-transactions/${tx.id}/approve`); } catch {}
    }
    setTransactions([]);
    flash(`✅ All transactions approved!`);
  };

  return (
    <div className="container pending-review-page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Clock size={22} style={{ color: '#f59e0b', marginRight: 8 }} />
            Pending SMS Review
          </h1>
          <p className="page-subtitle">
            Review bank SMS messages automatically captured. Approve, edit, or dismiss each transaction.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn-refresh" onClick={fetchPending} id="refresh-pending">
            <RefreshCw size={15} /> Refresh
          </button>
          {transactions.length > 0 && (
            <button className="btn-approve-all" onClick={approveAll} id="approve-all-btn">
              <CheckCircle2 size={15} /> Approve All ({transactions.length})
            </button>
          )}
        </div>
      </div>

      {/* Flash messages */}
      {successMsg && (
        <div className="flash-success">{successMsg}</div>
      )}
      {error && (
        <div className="flash-error">
          <AlertCircle size={15} /> {error}
          <button onClick={() => setError(null)}><X size={13} /></button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Loading pending transactions…
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={48} color="#10b981" />
          <h3>All caught up!</h3>
          <p>No pending SMS transactions. New bank SMS messages will appear here automatically.</p>
        </div>
      ) : (
        <>
          <div className="pending-count-bar">
            <span className="pending-count-badge">{transactions.length}</span>
            <span>pending transaction{transactions.length !== 1 ? 's' : ''} awaiting review</span>
          </div>
          <div className="pending-list">
            {transactions.map(tx => (
              <PendingCard
                key={tx.id}
                tx={tx}
                onApprove={handleApprove}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PendingReview;
