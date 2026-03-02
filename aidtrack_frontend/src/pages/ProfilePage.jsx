// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State for forms
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for messages
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // State for recent activity
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Fetch recent activity when the component mounts
  useEffect(() => {
    if (user?.id) {
      async function fetchActivity() {
        try {
          setActivityLoading(true);
          const response = await api.get(`/records/user/${user.id}`);
          setRecentActivity(response.data);
        } catch (error) {
          console.error("Error fetching recent activity:", error);
          // Don't show an error message for this, just leave it empty
        } finally {
          setActivityLoading(false);
        }
      }
      fetchActivity();
    }
  }, [user]); // Re-fetch if user changes (e.g., after profile update potentially)


  if (!user) {
    navigate('/login');
    return null;
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    try {
      const response = await api.put(`/users/${user.id}/profile`, { fullName });
      setProfileMessage(response.data.message);
      // NOTE: The name won't update in the context automatically here.
      // A more complex setup would update the AuthContext state.
      // For now, refreshing the page after update would show the change.
    } catch (error) {
      setProfileMessage(error.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match.'); return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage('New password must be at least 6 characters long.'); return;
    }
    try {
      const response = await api.put(`/users/${user.id}/password`, {
        currentPassword, newPassword,
      });
      setPasswordMessage(response.data.message + ' Please log in again.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(logout, 3000);
    } catch (error) {
      setPasswordMessage(error.response?.data?.message || 'Failed to change password.');
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">My Profile</h1>
        <button onClick={() => navigate(-1)} className="text-sm font-medium text-primary hover:text-primary-dark">
          &larr; Back
        </button>
      </header>

      {/* --- User Info Display --- */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase">Username</label>
          <p className="text-lg font-semibold text-gray-800">{user.username}</p>
        </div>
        <div>
          {/* Assume email exists if user exists */}
          <label className="block text-xs font-medium text-gray-500 uppercase">Email</label>
          <p className="text-lg text-gray-800">{user.email || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase">Role</label>
          <p className="text-lg font-semibold capitalize text-gray-800">{user.role}</p>
        </div>
        {/* Add Date Joined if available in your user object from backend */}
        {/*
         {user.createdAt && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">Member Since</label>
              <p className="text-lg text-gray-800">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
         )}
         */}
      </div>
      {/* --- End User Info Display --- */}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Update Profile Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Update Profile</h2>
          {profileMessage && <p className={`mb-4 text-center font-semibold ${profileMessage.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>{profileMessage}</p>}
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {/* Read-only username */}
            <div>
              <label htmlFor="username-display" className="block text-sm font-medium text-gray-700">Username</label>
              <input type="text" id="username-display" value={user.username} readOnly disabled className="w-full px-4 py-3 mt-1 border border-gray-200 bg-gray-100 rounded-lg" />
            </div>
            {/* Editable Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg shadow-sm" />
            </div>
            <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-primary rounded-lg shadow-lg hover:bg-primary-dark">
              Update Name
            </button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Change Password</h2>
          {passwordMessage && <p className={`mb-4 text-center font-semibold ${passwordMessage.includes('Failed') || passwordMessage.includes('Incorrect') || passwordMessage.includes('match') || passwordMessage.includes('least') ? 'text-red-500' : 'text-green-500'}`}>{passwordMessage}</p>}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
              <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg shadow-sm" placeholder="••••••••" />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
              <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg shadow-sm" placeholder="••••••••" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg shadow-sm" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-secondary rounded-lg shadow-lg hover:bg-green-600">
              Change Password
            </button>
          </form>
        </div>
      </div>

      {/* --- Recent Activity Section --- */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recent Activity (Last 10 Distributions)</h2>
        {activityLoading ? (
          <p className="text-gray-500">Loading activity...</p>
        ) : recentActivity.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {recentActivity.map(record => (
              <li key={record._id} className="py-3">
                <p className="text-sm text-gray-800">
                  Distributed <span className="font-semibold">{record.quantity} {record.item}</span> to <span className="font-semibold">{record.beneficiary?.familyId || record.familyId}</span> ({record.beneficiary?.headOfHousehold || 'N/A'}) in {record.location}.
                </p>
                <p className="text-xs text-gray-500">
                  On {new Date(record.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No recent distribution records found.</p>
        )}
      </div>
      {/* --- End Recent Activity Section --- */}

    </div>
  );
}

export default ProfilePage;