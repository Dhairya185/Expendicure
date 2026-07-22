import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/Table';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    is_default: false
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (editingId) {
        // Update existing category
        await api.put(`/categories/${editingId}`, {
          name: formData.name
        });
        setSuccess('Category updated successfully!');
      } else {
        // Add new category
        await api.post('/categories', {
          name: formData.name,
          is_default: formData.is_default
        });
        setSuccess('Category added successfully!');
      }
      // Refresh categories
      fetchCategories();
      // Reset form
      setFormData({
        name: '',
        is_default: false
      });
      setEditingId(null);
    } catch (err) {
      setError('Failed to save category');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      is_default: category.is_default
    });
    setEditingId(category.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setLoading(true);
      try {
        await api.delete(`/categories/${id}`);
        setSuccess('Category deleted successfully!');
        fetchCategories();
      } catch (err) {
        setError('Failed to delete category');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="category-manager-page">
      <div className="page-header">
        <h1>Category Manager</h1>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Category' : 'Add New Category'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Category Name</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="is_default">
                <Input
                  type="checkbox"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleChange}
                />
                Default Category
              </label>
            </div>

            <div className="form-actions">
              <Button type="submit" loading={loading}>
                {editingId ? 'Update Category' : 'Add Category'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setFormData({
                    name: '',
                    is_default: false
                  });
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
          <div className="card-header-actions">
            <Button variant="outline" size="small" onClick={() => {
              setFormData({
                name: '',
                is_default: false
              });
              setEditingId(null);
            }}>
              Add New Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Category Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>
                      <span className={`category-badge ${category.is_default ? 'default' : 'custom'}`}>
                        {category.is_default ? 'Default' : 'Custom'}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="actions">
                      <Button 
                        variant="outline" 
                        size="small"
                        onClick={() => handleEdit(category)}
                      >
                        Edit
                      </Button>
                      {!category.is_default && (
                        <Button 
                          variant="outline" 
                          size="small"
                          onClick={() => handleDelete(category.id)}
                        >
                          Delete
                        </Button>
                      )}
                      {category.is_default && (
                        <span className="disabled-action">Cannot Delete</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="no-data">No categories found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryManager;