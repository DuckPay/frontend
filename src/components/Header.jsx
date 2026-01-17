import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';
import ConnectionIndicator from './ConnectionIndicator';
import { useTranslation } from 'react-i18next';

// Unified Header component
const Header = ({ title }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Page title */}
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          
          {/* Connection status indicator */}
          <ConnectionIndicator />
          
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-red-500 hover:text-red-700 transition-colors ml-4"
          >
            <LogOut size={18} />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;