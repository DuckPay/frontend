import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { login, register, isAuthenticated } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import ConnectionIndicator from '../components/ConnectionIndicator';
import { useTranslation } from 'react-i18next';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if user is already authenticated and redirect to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate confirm password for registration
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }
    
    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.detail || err.message || '操作失败，请重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <motion.div 
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-center mb-2">
          {isLogin ? t('common.login') : t('common.register')}
        </h2>
        
        {/* Connection status indicator */}
        <div className="flex justify-center mb-4">
          <ConnectionIndicator />
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  {t('common.email')}
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
                  {t('common.username')}
                </label>
            <input
              type="text"
              name="username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
                  {t('common.password')}
                </label>
            <input
              type="password"
              name="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                  {t('common.confirmPassword')}
                </label>
              <input
                type="password"
                name="confirmPassword"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            {isLogin ? t('common.login') : t('common.register')}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            className="text-blue-500 hover:text-blue-700 text-sm"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? t('login.noAccount') : t('register.hasAccount')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;