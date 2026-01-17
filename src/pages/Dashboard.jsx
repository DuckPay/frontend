import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCurrentUser, logout, hasGroup, isAdmin, isOwner } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { Plus, User, CreditCard, PieChart, Shield } from 'lucide-react';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('records');
  const [currentUser, setCurrentUser] = useState(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Fetch current user information
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    fetchUser();
  }, []);

  // Dynamic tabs based on user groups
  const tabs = [
    { id: 'records', name: '记账记录', icon: <CreditCard size={20} /> },
    { id: 'categories', name: '分类管理', icon: <PieChart size={20} /> },
    { id: 'profile', name: '个人资料', icon: <User size={20} /> },
    // Add admin tab for users with admin or owner groups or any group with is_admin=true
    ...((currentUser && (isAdmin(currentUser) || hasGroup(currentUser, 'owner'))) ? [{ id: 'admin', name: t('common.adminPanel'), icon: <Shield size={20} /> }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <Header title={t('common.title')} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex space-x-4 border-b">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'admin') {
                    // Navigate to admin panel page
                    navigate('/admin');
                  } else {
                    // Switch tabs in dashboard
                    setActiveTab(tab.id);
                  }
                }}
                className={`flex items-center space-x-2 py-3 px-4 rounded-t-lg font-medium transition-colors ${activeTab === tab.id 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          {activeTab === 'records' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">记账记录</h2>
                <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md flex items-center space-x-2 transition-colors">
                  <Plus size={18} />
                  <span>添加记录</span>
                </button>
              </div>
              <div className="text-center text-gray-500 py-10">
                <p>暂无记账记录，点击上方按钮添加</p>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">分类管理</h2>
                <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md flex items-center space-x-2 transition-colors">
                  <Plus size={18} />
                  <span>添加分类</span>
                </button>
              </div>
              <div className="text-center text-gray-500 py-10">
                <p>分类管理功能正在开发中...</p>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">个人资料</h2>
              <div className="text-center text-gray-500 py-10">
                <p>个人资料功能正在开发中...</p>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;