import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCurrentUser, logout, hasGroup, isAdmin, isOwner, updateUserInfo } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { Plus, User, CreditCard, PieChart, Shield } from 'lucide-react';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('records');
  const [currentUser, setCurrentUser] = useState(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Profile form state
  const [profileFormData, setProfileFormData] = useState({
    username: '',
    nickname: '',
    email: ''
  });
  
  // Password form state
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Loading states
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Message states
  const [infoMessage, setInfoMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  
  // Initialize profile form data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileFormData({
        username: currentUser.username || '',
        nickname: currentUser.nickname || '',
        email: currentUser.email || ''
      });
    }
  }, [currentUser]);
  
  // Handle profile info update
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setIsUpdatingInfo(true);
    setInfoMessage(null);
    
    try {
      const updatedUser = await updateUserInfo(profileFormData);
      setCurrentUser(updatedUser);
      setInfoMessage({ type: 'success', text: '个人信息更新成功' });
    } catch (error) {
      console.error('Failed to update user info:', error);
      setInfoMessage({ type: 'error', text: `更新失败：${error.message || '未知错误'}` });
    } finally {
      setIsUpdatingInfo(false);
    }
  };
  
  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage(null);
    
    // Validate form
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: '新密码和确认密码不匹配' });
      setIsChangingPassword(false);
      return;
    }
    
    try {
      // Use updateUserInfo to change password
      await updateUserInfo({
        password: passwordFormData.newPassword
      });
      
      // Reset password form
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setPasswordMessage({ type: 'success', text: '密码修改成功' });
    } catch (error) {
      console.error('Failed to change password:', error);
      setPasswordMessage({ type: 'error', text: `密码修改失败：${error.message || '未知错误'}` });
    } finally {
      setIsChangingPassword(false);
    }
  };

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
              <h2 className="text-xl font-semibold text-gray-800 mb-6">个人设置</h2>
              {currentUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 基本信息设置 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-4">基本信息</h3>
                    <form onSubmit={handleUpdateInfo} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                        <input
                          type="text"
                          value={profileFormData.username}
                          onChange={(e) => setProfileFormData({ ...profileFormData, username: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="用户名"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                        <input
                          type="text"
                          value={profileFormData.nickname}
                          onChange={(e) => setProfileFormData({ ...profileFormData, nickname: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="昵称"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                        <input
                          type="email"
                          value={profileFormData.email}
                          onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="邮箱"
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isUpdatingInfo}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdatingInfo ? '保存中...' : '保存修改'}
                        </button>
                      </div>
                    </form>
                    {infoMessage && (
                      <div className={`mt-4 p-3 rounded-md ${infoMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {infoMessage.text}
                      </div>
                    )}
                  </div>
                  
                  {/* 密码设置 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-4">密码设置</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">当前密码</label>
                        <input
                          type="password"
                          value={passwordFormData.currentPassword}
                          onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="当前密码"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                        <input
                          type="password"
                          value={passwordFormData.newPassword}
                          onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="新密码"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                        <input
                          type="password"
                          value={passwordFormData.confirmPassword}
                          onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="确认新密码"
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isChangingPassword ? '修改中...' : '修改密码'}
                        </button>
                      </div>
                    </form>
                    {passwordMessage && (
                      <div className={`mt-4 p-3 rounded-md ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {passwordMessage.text}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;