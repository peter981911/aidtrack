import { useState, useMemo, useEffect } from 'react';
import api from '../api';
import Card from './ui/Card';
import Button from './ui/Button';
import { useAuth } from '../context/AuthContext';

function RecordsTable() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const { user } = useAuth();

  // Edit/Delete State
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({ quantity: 0, location: '' });
  const [isDeleting, setIsDeleting] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/records?page=${currentPage}&limit=${limit}&search=${searchTerm}`);
      if (response.data.records) {
        setRecords(response.data.records);
        setTotalPages(response.data.pages);
      } else {
        setRecords(response.data);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm]);

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setEditFormData({ quantity: record.quantity, location: record.location });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/records/${editingRecord._id}`, editFormData);
      setEditingRecord(null);
      fetchRecords();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating record.');
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this distribution record? Reverted stock will be returned to inventory.')) return;
    setIsDeleting(id);
    try {
      await api.delete(`/records/${id}`);
      fetchRecords();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting record.');
    } finally {
      setIsDeleting(null);
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await api.get('/records'); // fetch without page for all records
      const exportRecords = response.data.records ? response.data.records : response.data;
      const headers = ['Family ID', 'Location', 'Item', 'Quantity', 'Date', 'Volunteer'];
      const csvData = exportRecords.map(r => [
        r.familyId,
        `"${r.location}"`,
        `"${r.item}"`,
        r.quantity,
        new Date(r.createdAt).toLocaleDateString(),
        `"${r.distributedBy?.fullName || 'N/A'}"`
      ]);

      const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `records_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      alert("Error exporting CSV: " + error.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-heading font-bold text-gray-900">Distribution History</h2>

        <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search records..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input outline-none shadow-sm"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          {user?.role === 'admin' && (
            <Button onClick={exportToCSV} variant="secondary" className="whitespace-nowrap">
              Export CSV
            </Button>
          )}
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-t-4 border-t-primary">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Family</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Volunteer</th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10 text-gray-500">Loading records...</td></tr>
              ) : records.length > 0 ? (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">{record.familyId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.item}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(record.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 mr-2">
                          {record.distributedBy?.fullName?.charAt(0) || '?'}
                        </div>
                        {record.distributedBy?.fullName || 'N/A'}
                      </div>
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button onClick={() => handleEditClick(record)} className="text-secondary hover:text-secondary-dark transition-colors">Edit</button>
                        <button onClick={() => handleDeleteClick(record._id)} disabled={isDeleting === record._id} className="text-red-500 hover:text-red-700 transition-colors">
                          {isDeleting === record._id ? '...' : 'Delete'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={user?.role === 'admin' ? "7" : "6"} className="text-center py-10 text-gray-500">No records found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                Previous
              </Button>
              <Button type="button" variant="secondary" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md animate-slide-up">
            <h3 className="text-xl font-bold mb-4">Edit Distribution Record</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p><strong>Item:</strong> {editingRecord.item}</p>
              <p><strong>Family:</strong> {editingRecord.familyId}</p>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input type="number" value={editFormData.quantity} onChange={(e) => setEditFormData({ ...editFormData, quantity: Number(e.target.value) })} required className="w-full px-4 py-2 rounded-lg border outline-none" />
                <p className="text-xs text-gray-500 mt-1">Stock reserves will be adjusted automatically.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input type="text" value={editFormData.location} onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })} required className="w-full px-4 py-2 rounded-lg border outline-none" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => setEditingRecord(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default RecordsTable;