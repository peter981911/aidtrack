import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Card from './ui/Card';
import Button from './ui/Button';

function BeneficiariesPage() {
  const { user } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [familyId, setFamilyId] = useState('');
  const [headOfHousehold, setHeadOfHousehold] = useState('');
  const [numberOfMembers, setNumberOfMembers] = useState(1);
  const [location, setLocation] = useState('');

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Edit/Delete State
  const [editingBeneficiary, setEditingBeneficiary] = useState(null);
  const [editFormData, setEditFormData] = useState({ headOfHousehold: '', numberOfMembers: 1, location: '' });
  const [isDeleting, setIsDeleting] = useState(null);

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/beneficiaries?page=${currentPage}&limit=${limit}&search=${searchTerm}&location=${filterLocation}`);
      if (response.data.beneficiaries) {
        setBeneficiaries(response.data.beneficiaries);
        setTotalPages(response.data.pages);
      } else {
        setBeneficiaries(response.data);
        setTotalPages(1);
      }
    } catch (err) {
      setError('Failed to fetch beneficiaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBeneficiaries();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, filterLocation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      await api.post('/beneficiaries', {
        familyId,
        headOfHousehold,
        numberOfMembers,
        location,
        userId: user.id
      });
      setMessage('Beneficiary registered successfully!');
      // Clear form and refresh list
      setFamilyId('');
      setHeadOfHousehold('');
      setNumberOfMembers(1);
      setLocation('');
      fetchBeneficiaries();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setEditFormData({
      headOfHousehold: beneficiary.headOfHousehold,
      numberOfMembers: beneficiary.numberOfMembers,
      location: beneficiary.location
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/beneficiaries/${editingBeneficiary._id}`, editFormData);
      setMessage(`Successfully updated ${editingBeneficiary.familyId}.`);
      setEditingBeneficiary(null);
      fetchBeneficiaries();
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating beneficiary.');
    }
  };

  const handleDeleteClick = async (id, familyId) => {
    if (!window.confirm(`Are you sure you want to delete beneficiary ${familyId}?`)) return;
    setIsDeleting(id);
    try {
      await api.delete(`/beneficiaries/${id}`);
      setMessage(`Beneficiary ${familyId} deleted successfully.`);
      fetchBeneficiaries();
    } catch (error) {
      setError(error.response?.data?.message || 'Error deleting beneficiary.');
    } finally {
      setIsDeleting(null);
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await api.get('/beneficiaries'); // fetch without page for all records
      const exportRecords = response.data.beneficiaries ? response.data.beneficiaries : response.data;
      const headers = ['Family ID', 'Head of Household', 'Members', 'Location', 'Registered By', 'Date'];
      const csvData = exportRecords.map(b => [
        b.familyId,
        `"${b.headOfHousehold}"`,
        b.numberOfMembers,
        `"${b.location}"`,
        `"${b.registeredBy?.username || 'N/A'}"`,
        new Date(b.createdAt).toLocaleDateString()
      ]);

      const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `beneficiaries_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      alert("Error exporting CSV: " + error.message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-gray-900">Beneficiary Management</h2>
        {message && (
          <span className="px-4 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-medium animate-fade-in">
            {message}
          </span>
        )}
        {error && (
          <span className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-medium animate-fade-in">
            {error}
          </span>
        )}
      </div>

      {/* Registration Form */}
      <Card className="border-t-4 border-t-primary">
        <h3 className="text-lg font-heading font-semibold text-gray-800 mb-6">Register New Family</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div>
            <label htmlFor="familyId" className="block text-sm font-medium text-gray-700 mb-1">Family ID</label>
            <input
              type="text"
              id="familyId"
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value)}
              required
              placeholder="e.g., FAM-1001"
              className="w-full px-4 py-2.5 rounded-lg glass-input outline-none"
            />
          </div>
          <div>
            <label htmlFor="head" className="block text-sm font-medium text-gray-700 mb-1">Head of Household</label>
            <input
              type="text"
              id="head"
              value={headOfHousehold}
              onChange={(e) => setHeadOfHousehold(e.target.value)}
              required
              placeholder="e.g., Jane Doe"
              className="w-full px-4 py-2.5 rounded-lg glass-input outline-none"
            />
          </div>
          <div>
            <label htmlFor="members" className="block text-sm font-medium text-gray-700 mb-1">Family Members</label>
            <input
              type="number"
              id="members"
              value={numberOfMembers}
              onChange={(e) => setNumberOfMembers(Number(e.target.value))}
              required
              min="1"
              className="w-full px-4 py-2.5 rounded-lg glass-input outline-none"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location / Area</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              placeholder="District, Area"
              className="w-full px-4 py-2.5 rounded-lg glass-input outline-none"
            />
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full md:w-auto px-8 shadow-lg shadow-primary/20">
              Register Beneficiary
            </Button>
          </div>
        </form>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white/50 p-4 rounded-xl border border-gray-100">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by Family ID or Name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-2.5 rounded-lg glass-input outline-none"
          />
        </div>
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Filter by Location..."
            value={filterLocation}
            onChange={(e) => { setFilterLocation(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-2.5 rounded-lg glass-input outline-none"
          />
        </div>
        {user?.role === 'admin' && (
          <Button onClick={exportToCSV} variant="secondary" className="w-full md:w-auto whitespace-nowrap">
            Export CSV
          </Button>
        )}
      </div>

      {/* Beneficiaries Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Family ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Head of Household</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Members</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Registered By</th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={user?.role === 'admin' ? "6" : "5"} className="text-center py-10 text-gray-500">Loading beneficiaries...</td></tr>
              ) : beneficiaries.length === 0 ? (
                <tr><td colSpan={user?.role === 'admin' ? "6" : "5"} className="text-center py-10 text-gray-500">No beneficiaries found matching your search.</td></tr>
              ) : beneficiaries.map((b) => (
                <tr key={b._id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">{b.familyId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{b.headOfHousehold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.numberOfMembers}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{b.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 mr-2">
                        {b.registeredBy?.username?.charAt(0) || '?'}
                      </div>
                      {b.registeredBy?.username || 'N/A'}
                    </div>
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button onClick={() => handleEditClick(b)} className="text-secondary hover:text-secondary-dark transition-colors">Edit</button>
                      <button onClick={() => handleDeleteClick(b._id, b.familyId)} disabled={isDeleting === b._id} className="text-red-500 hover:text-red-700 transition-colors">
                        {isDeleting === b._id ? '...' : 'Delete'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
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
      {editingBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md animate-slide-up">
            <h3 className="text-xl font-bold mb-4">Edit Beneficiary</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p><strong>Family ID:</strong> {editingBeneficiary.familyId}</p>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Head of Household</label>
                <input type="text" value={editFormData.headOfHousehold} onChange={(e) => setEditFormData({ ...editFormData, headOfHousehold: e.target.value })} required className="w-full px-4 py-2 rounded-lg border outline-none" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Members</label>
                  <input type="number" min="1" value={editFormData.numberOfMembers} onChange={(e) => setEditFormData({ ...editFormData, numberOfMembers: Number(e.target.value) })} required className="w-full px-4 py-2 rounded-lg border outline-none" />
                </div>
                <div className="flex-[2]">
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input type="text" value={editFormData.location} onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })} required className="w-full px-4 py-2 rounded-lg border outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => setEditingBeneficiary(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default BeneficiariesPage;