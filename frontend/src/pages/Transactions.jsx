import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download, Trash2, ChevronLeft, ChevronRight, CreditCard, ArrowRightLeft } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/transactions`);
      setTransactions(response.data);
    } catch (err) {
      setError('Failed to load transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchTransactions(); // Refresh the list
      } catch (err) {
        setError('Failed to delete transaction');
        console.error(err);
      }
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="container"><div className="loading">Loading...</div></div>;
  if (error) return <div className="container"><div className="error">{error}</div></div>;

  return (
    <div className="container">
      <div className="main-content">
        <div className="page-header">
          <div className="page-header-text">
            <h1>All Transactions</h1>
            <p>Review and manage your recent spending.</p>
          </div>
          <Link to="/transactions/add" className="btn btn-primary">
            <Plus size={18} /> Add Transaction
          </Link>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
            <div className="search-wrapper">
              <Search />
              <input 
                type="text" 
                className="input" 
                placeholder="Search merchants..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="controls" style={{ margin: 0 }}>
              <button className="btn btn-outline">
                <Filter size={16} /> Filter
              </button>
              <button className="btn btn-outline">
                <Download size={16} /> Export
              </button>
            </div>
          </div>

          <div className="card-content" style={{ padding: 0 }}>
            {filteredTransactions.length > 0 ? (
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
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => {
                      const dateObj = new Date(transaction.payment_date);
                      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      return (
                        <tr key={transaction.id}>
                          <td style={{ color: 'var(--text-secondary)' }}>{formattedDate}</td>
                          <td style={{ fontWeight: 500 }}>{transaction.merchant_name}</td>
                          <td><span className="pill">{transaction.category_name}</span></td>
                          <td style={{ fontWeight: 500, color: transaction.amount > 0 ? '#ef4444' : (transaction.amount < 0 ? '#10b981' : 'inherit') }}>
                            {transaction.amount > 0 ? '-' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {transaction.payment_method?.toLowerCase().includes('card') ? <CreditCard size={14}/> : <ArrowRightLeft size={14}/>}
                              {transaction.payment_method || '-'}
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {transaction.notes || '-'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              onClick={() => handleDelete(transaction.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}
                              title="Delete Transaction"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No transactions found.
              </div>
            )}
          </div>
          
          <div className="pagination">
            <span>Showing 1-{Math.min(8, filteredTransactions.length)} of {filteredTransactions.length} transactions</span>
            <div className="pagination-controls">
              <button className="page-btn"><ChevronLeft size={18} /></button>
              <button className="page-btn"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Transactions;