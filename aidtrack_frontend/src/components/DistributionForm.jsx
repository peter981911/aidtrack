// src/components/DistributionForm.jsx
import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Card from './ui/Card';
import Button from './ui/Button';

// Define standard categories
const standardCategories = ['Food', 'Drinks', 'Medical', 'Shelter', 'Clothing', 'Hygiene', 'Other'];
const CUSTOM_ITEM_VALUE = '--CUSTOM--'; // Special value for the dropdown

function DistributionForm() {
  const { user } = useAuth();
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [itemSelection, setItemSelection] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for custom item input
  const [isCustomItem, setIsCustomItem] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemCategory, setCustomItemCategory] = useState(standardCategories[0]);

  // Data for dropdowns
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  // Beneficiary search state
  const [search, setSearch] = useState('');
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const [stockRes, benRes] = await Promise.all([
          api.get('/stock'),
          api.get('/beneficiaries')
        ]);

        setStockItems(stockRes.data);
        if (stockRes.data.length > 0) {
          setItemSelection(stockRes.data[0].name);
        } else {
          setItemSelection(CUSTOM_ITEM_VALUE);
          setIsCustomItem(true);
        }

        setBeneficiaries(benRes.data);
        setFilteredBeneficiaries(benRes.data.slice(0, 10));
      } catch (error) {
        console.error("Error fetching data:", error);
        setMessage('Error fetching initial data.');
      }
    }
    fetchData();
  }, []);

  // Handle changes in the main item dropdown
  const handleItemSelectionChange = (e) => {
    const value = e.target.value;
    setItemSelection(value);
    if (value === CUSTOM_ITEM_VALUE) {
      setIsCustomItem(true);
    } else {
      setIsCustomItem(false);
      setCustomItemName('');
    }
  };

  // --- Beneficiary Search Logic ---
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearch(term);
    setIsDropdownOpen(true);
    setSelectedBeneficiary(null);
    if (!term) {
      setFilteredBeneficiaries(beneficiaries.slice(0, 10));
    } else {
      setFilteredBeneficiaries(
        beneficiaries.filter(b =>
          b.familyId.toLowerCase().includes(term.toLowerCase()) ||
          b.headOfHousehold.toLowerCase().includes(term.toLowerCase())
        ).slice(0, 10)
      );
    }
  };
  const selectBeneficiary = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setSearch(`${beneficiary.familyId} - ${beneficiary.headOfHousehold}`);
    setIsDropdownOpen(false);
  };
  // --- End Beneficiary Search Logic ---


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!user) { setMessage('Error: You must be logged in.'); return; }
    if (!selectedBeneficiary) { setMessage('Error: Please select a valid beneficiary.'); return; }

    let itemToSend;
    let categoryToSend = null;

    if (isCustomItem) {
      if (!customItemName.trim()) {
        setMessage('Error: Please enter a name for the custom item.'); return;
      }
      itemToSend = customItemName.trim();
      categoryToSend = customItemCategory;
    } else {
      if (!itemSelection) {
        setMessage('Error: Please select an item.'); return;
      }
      itemToSend = itemSelection;
    }

    setIsSubmitting(true);
    try {
      const recordData = {
        beneficiaryId: selectedBeneficiary._id,
        familyId: selectedBeneficiary.familyId,
        location: selectedBeneficiary.location,
        item: itemToSend,
        quantity,
        userId: user.id,
        ...(isCustomItem && { category: categoryToSend })
      };

      await api.post('/records', recordData);

      setMessage('Record submitted successfully!');
      // Reset form
      setSearch('');
      setSelectedBeneficiary(null);
      setQuantity(1);
      setCustomItemName('');
      if (stockItems.length > 0) {
        setItemSelection(stockItems[0].name);
        setIsCustomItem(false);
      } else {
        setItemSelection(CUSTOM_ITEM_VALUE);
        setIsCustomItem(true);
      }

    } catch (error) {
      setMessage(error.response?.data?.message || 'Error submitting record.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto border-t-4 border-t-secondary animate-fade-in">
      <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">Log New Distribution</h2>

      {message && (
        <div className={`mb-6 p-4 rounded-lg font-medium text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Beneficiary Search Input */}
        <div className="relative">
          <label htmlFor="beneficiary" className="block text-sm font-semibold text-gray-700 mb-1">Search Beneficiary</label>
          <input
            type="text"
            id="beneficiary"
            value={search}
            onChange={handleSearch}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Search by ID or Name..."
            required
            className="w-full px-4 py-3 rounded-lg glass-input outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Select a beneficiary from the list to continue</p>

          {isDropdownOpen && filteredBeneficiaries.length > 0 && (
            <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-xl">
              {filteredBeneficiaries.map(b => (
                <li key={b._id} onClick={() => selectBeneficiary(b)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                  <div className="font-semibold text-gray-900">{b.headOfHousehold}</div>
                  <div className="text-xs text-gray-500">{b.familyId} • {b.location}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-6 bg-gray-50/50 rounded-xl border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Distribution Details</h3>

          {/* --- ITEM SELECTION AREA --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <select
                id="item"
                value={itemSelection}
                onChange={handleItemSelectionChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-secondary/20 outline-none"
              >
                <option value="" disabled>-- Select Item --</option>
                {stockItems.map(stockItem => (
                  <option key={stockItem._id} value={stockItem.name}>
                    {stockItem.name} ({stockItem.units}) - {stockItem.quantity} left
                  </option>
                ))}
                <option value={CUSTOM_ITEM_VALUE}>+ Enter Custom Item</option>
              </select>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                min="1"
                max={!isCustomItem ? stockItems.find(i => i.name === itemSelection)?.quantity : undefined}
                className="w-full px-4 py-3 rounded-lg glass-input outline-none"
              />
              {!isCustomItem && itemSelection && (
                <p className="text-xs text-gray-500 mt-1">
                  Available: <span className="font-semibold text-gray-700">{stockItems.find(i => i.name === itemSelection)?.quantity || 0}</span>
                </p>
              )}
            </div>
          </div>

          {/* --- CUSTOM ITEM INPUTS (Conditionally Rendered) --- */}
          {isCustomItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-blue-100 rounded-lg bg-blue-50/50 animate-slide-up">
              <div className="md:col-span-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block">Custom Item Details</span>
              </div>
              <div>
                <label htmlFor="customItemName" className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  id="customItemName"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  required={isCustomItem}
                  placeholder="e.g., Baby Formula"
                  className="w-full px-4 py-2.5 bg-white rounded-lg border border-blue-200 outline-none"
                />
              </div>
              <div>
                <label htmlFor="customItemCategory" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  id="customItemCategory"
                  value={customItemCategory}
                  onChange={(e) => setCustomItemCategory(e.target.value)}
                  required={isCustomItem}
                  className="w-full px-4 py-2.5 bg-white rounded-lg border border-blue-200 outline-none"
                >
                  {standardCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full py-4 text-lg font-bold shadow-xl shadow-secondary/20 bg-gradient-to-r from-secondary to-teal-600 hover:from-teal-600 hover:to-secondary">
          Submit Distribution Record
        </Button>
      </form>
    </Card>
  );
}

export default DistributionForm;