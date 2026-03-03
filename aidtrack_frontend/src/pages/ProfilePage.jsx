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
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-primary-dark via-primary to-secondary-dark rounded-[2rem] p-6 sm:p-8 overflow-hidden shadow-xl mb-8 border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-10 left-10 w-64 h-64 bg-secondary-light/20 rounded-full mix-blend-overlay filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar Placeholder */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur-md border-[2px] border-white/30 flex items-center justify-center shadow-lg shrink-0">
            <span className="text-3xl sm:text-4xl font-heading font-bold text-white shadow-sm">
              {user.username.substring(0, 2).toUpperCase()}
            </span>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-1 tracking-tight">My Profile</h1>
            <p className="text-white/80 text-base font-light flex items-center justify-center md:justify-start gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Welcome back, <span className="font-semibold text-white">{user.fullName || user.username}</span>
            </p>
          </div>

          <div>
            <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all shadow-md flex items-center gap-2 font-medium text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Go Back
            </button>
          </div>
        </div>
      </div>

      {/* --- User Info Display --- */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-xl mb-10 grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-light/10 rounded-full blur-2xl"></div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 tracking-widest uppercase mb-1">Username</label>
          <p className="text-xl font-bold text-gray-900">{user.username}</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 tracking-widest uppercase mb-1">Email</label>
          <p className="text-xl font-bold text-gray-900">{user.email || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 tracking-widest uppercase mb-1">Role</label>
          <div className="mt-1">
            <span className="px-3 py-1 pb-1.5 rounded-full text-sm font-bold capitalize bg-primary-light/20 text-primary-dark border border-primary/20 shadow-sm">
              {user.role}
            </span>
          </div>
        </div>
      </div>
      {/* --- End User Info Display --- */}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Update Profile Section */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-light/10 rounded-full blur-2xl"></div>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Update Profile
          </h2>
          {profileMessage && <p className={`mb-6 p-3 rounded-xl text-sm font-semibold backdrop-blur-md border ${profileMessage.includes('Failed') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{profileMessage}</p>}
          <form onSubmit={handleProfileUpdate} className="space-y-5 relative z-10">
            {/* Read-only username */}
            <div>
              <label htmlFor="username-display" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Username</label>
              <input type="text" id="username-display" value={user.username} readOnly disabled className="w-full px-5 py-3.5 bg-gray-50/50 rounded-xl border border-gray-100 text-gray-500 cursor-not-allowed text-base" />
            </div>
            {/* Editable Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Full Name</label>
              <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-5 py-3.5 rounded-xl glass-input placeholder-gray-400 text-gray-900 outline-none text-base transition-all" />
            </div>
            <div className="pt-2">
              <button type="submit" className="w-full px-5 py-4 font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all">
                Save Name Changes
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-light/10 rounded-full blur-2xl"></div>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Security Setup
          </h2>
          {passwordMessage && <p className={`mb-6 p-3 rounded-xl text-sm font-semibold backdrop-blur-md border ${passwordMessage.includes('Failed') || passwordMessage.includes('Incorrect') || passwordMessage.includes('match') || passwordMessage.includes('least') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{passwordMessage}</p>}
          <form onSubmit={handlePasswordChange} className="space-y-5 relative z-10">
            <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
              <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Current Password</label>
              <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-5 py-3.5 rounded-xl glass-input placeholder-gray-400 text-gray-900 outline-none text-base transition-all" placeholder="••••••••" />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">New Password</label>
              <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full px-5 py-3.5 rounded-xl glass-input placeholder-gray-400 text-gray-900 outline-none text-base transition-all" placeholder="••••••••" />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Confirm New Password</label>
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-5 py-3.5 rounded-xl glass-input placeholder-gray-400 text-gray-900 outline-none text-base transition-all" placeholder="••••••••" />
            </div>
            <div className="pt-2">
              <button type="submit" className="w-full px-5 py-4 font-semibold text-white bg-gradient-to-r from-secondary to-secondary-dark rounded-xl shadow-lg shadow-secondary/30 hover:-translate-y-0.5 transition-all">
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- Recent Activity Section --- */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-light/10 rounded-full blur-3xl mix-blend-multiply"></div>
        <h2 className="text-2xl font-heading font-bold text-gray-900 mb-8 flex items-center gap-2 relative z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Timeline
        </h2>

        <div className="relative z-10 pl-4 border-l-2 border-gray-100">
          {activityLoading ? (
            <div className="flex items-center gap-3 py-4 text-gray-500">
              <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-primary animate-spin"></div>
              Loading activity history...
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-8">
              {recentActivity.map((record, index) => (
                <div key={record._id} className="relative animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  {/* Timeline Node */}
                  <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-white shadow-sm"></div>

                  <div className="bg-gray-50/50 hover:bg-surface-100 transition-colors p-4 rounded-2xl border border-gray-100/50 ml-6">
                    <p className="text-base text-gray-800 leading-relaxed">
                      Distributed{' '}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-bold bg-primary-light/10 text-primary-dark shadow-sm">
                        {record.quantity} {record.item}
                      </span>
                      {' '}to <span className="font-semibold text-gray-900">{record.beneficiary?.familyId || record.familyId}</span>{' '}
                      <span className="text-gray-500">({record.beneficiary?.headOfHousehold || 'N/A'})</span> in{' '}
                      <span className="font-medium text-gray-700">{record.location}</span>.
                    </p>
                    <p className="text-xs font-semibold text-gray-400 mt-2 uppercase tracking-wider flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(record.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 ml-6 text-gray-500 bg-gray-50/50 rounded-2xl text-center border border-dashed border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              No recent distribution records found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default ProfilePage;