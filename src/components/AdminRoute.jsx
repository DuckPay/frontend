import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser, hasGroup, isAdmin } from '../utils/auth';
import { useAuth } from '../utils/auth';

// Admin route component - only allows access to admins
const AdminRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Check if current user is admin or owner
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        if (isAuthenticated) {
          const user = await getCurrentUser();
          setIsAdminUser(isAdmin(user) || hasGroup(user, 'owner'));
        }
      } catch (error) {
        setIsAdminUser(false);
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, [isAuthenticated]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  if (!isAdminUser) {
    // Redirect to dashboard if not admin
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
