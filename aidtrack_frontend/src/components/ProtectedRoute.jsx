import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// This component wraps routes that require authentication
// Optionally, it can also check for a specific role (like 'admin')
function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();

  // 1. Check if user is logged in
  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // 2. Check if a specific role is required and if the user has it
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User is logged in, but doesn't have the required role.
    // Redirect them to their designated portal based on their actual role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'volunteer') {
      return <Navigate to="/volunteer" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // 3. If all checks pass, render the component the route points to
  // <Outlet /> is a placeholder for the actual page component (AdminPage or VolunteerPage)
  return <Outlet />;
}

export default ProtectedRoute;