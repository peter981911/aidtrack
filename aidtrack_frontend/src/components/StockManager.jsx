// src/components/StockManager.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import Card from './ui/Card';
import Button from './ui/Button';

function StockManager() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Form state
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [category, setCategory] = useState('');
  const [units, setUnits] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', category: '', units: '', quantity: 0 });
  const [isDeleting, setIsDeleting] = useState(null);

  // Function to fetch stock data
  const fetchStock = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stock');
      setStock(response.data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setMessage('Error fetching stock data.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchStock();
  }, []);

  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditFormData({ name: item.name, category: item.category, units: item.units, quantity: item.quantity });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/stock/${editingItem._id}`, editFormData);
      setMessage(`Successfully updated ${editFormData.name}.`);
      setEditingItem(null);
      fetchStock();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating stock.');
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stock item? This cannot be undone.')) return;
    setIsDeleting(id);
    try {
      await api.delete(`/stock/${id}`);
      setMessage('Item deleted successfully.');
      fetchStock();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error deleting item.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);
    try {
      // Send all fields to the backend
      await api.post('/stock/update', {
        itemName,
        quantity,
        category,
        units
      });
      setMessage(`Successfully updated stock for ${itemName}.`);
      // Clear form and refresh data
      setItemName('');
      setQuantity(0);
      setCategory('');
      setUnits('');
      fetchStock();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating stock.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-gray-900">Inventory Management</h2>
        {message && (
          <span className={`px-4 py-2 rounded-lg text-sm font-medium animate-fade-in ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </span>
        )}
      </div>

      {/* Updated Form */}
      <Card className="border-t-4 border-t-primary">
        <h3 className="text-lg font-heading font-semibold text-gray-800 mb-4">Update / Add Stock</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          {/* Item Name */}
          <div className="md:col-span-4">
            <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              placeholder="e.g., Rice"
              className="w-full px-4 py-2.5 rounded-lg glass-input outline-none"
            />
          </div>

          {/* Category */}
          <div className="md:col-span-3">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Food"
              className="w-full px-4 py-2.5 rounded-lg glass-input outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Required for new items</p>
          </div>

          {/* Units */}
          <div className="md:col-span-2">
            <label htmlFor="units" className="block text-sm font-medium text-gray-700 mb-1">Units</label>
            <input
              type="text"
              id="units"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="e.g., kg"
              className="w-full px-4 py-2.5 rounded-lg glass-input outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Required for new items</p>
          </div>

          {/* Quantity */}
          <div className="md:col-span-3">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity (+/-)</label>
            <div className="flex gap-2">
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-lg glass-input outline-none"
              />
              <Button type="submit" isLoading={isSubmitting} className="whitespace-nowrap shadow-lg shadow-primary/20">
                Update
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Updated Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Units</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Available Quantity</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-10 text-gray-500">Loading stock data...</td></tr>
              ) : stock.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-10 text-gray-500">No stock items found.</td></tr>
              ) : stock.map((item) => (
                <tr key={item._id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.units}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-bold ${item.quantity < 20 ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.quantity}
                    </span>
                    {item.quantity < 20 && (
                      <span className="ml-3 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 animate-pulse">
                        Low
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button onClick={() => handleEditClick(item)} className="text-secondary hover:text-secondary-dark transition-colors">Edit</button>
                    <button onClick={() => handleDeleteClick(item._id)} disabled={isDeleting === item._id} className="text-red-500 hover:text-red-700 transition-colors">
                      {isDeleting === item._id ? '...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md animate-slide-up">
            <h3 className="text-xl font-bold mb-4">Edit Stock Item</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} required className="w-full px-4 py-2 rounded-lg border outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input type="text" value={editFormData.category} onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })} required className="w-full px-4 py-2 rounded-lg border outline-none" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Units</label>
                  <input type="text" value={editFormData.units} onChange={(e) => setEditFormData({ ...editFormData, units: e.target.value })} required className="w-full px-4 py-2 rounded-lg border outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input type="number" value={editFormData.quantity} onChange={(e) => setEditFormData({ ...editFormData, quantity: Number(e.target.value) })} required className="w-full px-4 py-2 rounded-lg border outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => setEditingItem(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default StockManager;