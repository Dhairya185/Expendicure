import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>Transactions</h1>
        <div className="controls">
          <Link to="/transactions/add" className="btn-primary">
            Add Transaction
          </Link>
        </div>
      </div>

      {transactions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Merchant</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.payment_date}</TableCell>
                    <TableCell>{transaction.merchant_name}</TableCell>
                    <TableCell>{transaction.category_name}</TableCell>
                    <TableCell>${transaction.amount}</TableCell>
                    <TableCell>{transaction.payment_method || '-'}</TableCell>
                    <TableCell>{transaction.notes || '-'}</TableCell>
                    <TableCell className="actions">
                      <Button 
                        variant="outline" 
                        size="small"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <p className="no-data">No transactions found</p>
      )}
    </div>
  );
};

export default Transactions;