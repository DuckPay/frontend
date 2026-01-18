import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { login, register, isAuthenticated, getEnabledOicdProviders, linkAccount } from '../utils/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [oicdProviders, setOicdProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [needsAccountLink, setNeedsAccountLink] = useState(false);
  const [accountLinkChoice, setAccountLinkChoice] = useState(null); // null: not chosen, 'existing': link to existing, 'new': create new
  const [oicdData, setOicdData] = useState({});
  const navigate = useNavigate();

  // Check if user is already authenticated and redirect to dashboard
  // Skip redirection if we're in account linking flow
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const needsLink = searchParams.get('needs_account_link');
    
    // If we're in account linking flow, don't redirect to dashboard
    // even if we have an access token from OAuth provider
    if (needsLink === 'true') {
      return;
    }
    
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate, searchParams]);
  
  // Fetch enabled OICD providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const providers = await getEnabledOicdProviders();
        setOicdProviders(providers);
      } catch (err) {
        console.error('Failed to fetch OICD providers:', err);
      } finally {
        setProvidersLoading(false);
      }
    };
    
    fetchProviders();
  }, []);
  
  // Handle OICD callback parameters
  useEffect(() => {
    // Check if account linking is needed
    const needsLink = searchParams.get('needs_account_link');
    
    if (needsLink === 'true') {
      // Extract OICD data from URL parameters
      const oicdParams = {
        provider: searchParams.get('provider'),
        providerUserId: searchParams.get('provider_user_id'),
        email: searchParams.get('email'),
        username: searchParams.get('username'),
        displayName: searchParams.get('display_name'),
        avatarUrl: searchParams.get('avatar_url'),
        accessToken: searchParams.get('access_token'),
        refreshToken: searchParams.get('refresh_token'),
        expiresAt: searchParams.get('expires_at')
      };
      
      setOicdData(oicdParams);
      setNeedsAccountLink(true);
      // Switch to registration form for account linking
      setIsLogin(false);
      // Pre-fill email from OICD data
      setFormData(prev => ({
        ...prev,
        email: oicdParams.email || '',
        username: oicdParams.username || ''
      }));
      return;
    }
    
    // Check if there's an access_token in the URL (user already authenticated)
    const accessToken = searchParams.get('access_token');
    if (accessToken) {
      // Save the access token to localStorage
      localStorage.setItem('token', accessToken);
      // Redirect to dashboard
      navigate('/dashboard');
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (needsAccountLink && accountLinkChoice) {
        // Handle account linking case
        if (accountLinkChoice === 'existing') {
          // Link to existing account: login first, then link
          await login(formData.username, formData.password);
          await linkAccount(oicdData);
        } else if (accountLinkChoice === 'new') {
          // Create new account and link
          // Validate confirm password for registration
          if (formData.password !== formData.confirmPassword) {
            setError(t('register.passwordMismatch'));
            return;
          }
          await register({ 
            username: formData.username,
            email: formData.email,
            password: formData.password
          });
          await linkAccount(oicdData);
        }
        navigate('/dashboard');
      } else if (isLogin) {
        // Normal login case
        await login(formData.username, formData.password);
        navigate('/dashboard');
      } else {
        // Normal registration case
        // Validate confirm password for registration
        if (formData.password !== formData.confirmPassword) {
          setError(t('register.passwordMismatch'));
          return;
        }
        await register({ 
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        // Login with newly created account to get token
        await login(formData.username, formData.password);
        navigate('/dashboard');
      }
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
        
        {/* Show account linking prompt and form */}
        {needsAccountLink && (
          <div>
            {/* OICD Account Linking Prompt */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    {t('common.accountLinking')}
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      {t('common.accountLinkingDescription', { provider: oicdData.provider || 'OICD' })}
                    </p>
                    {!accountLinkChoice ? (
                      <div className="mt-4 space-y-3">
                        <p className="font-medium">请选择您的操作：</p>
                        <button
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                          onClick={() => setAccountLinkChoice('existing')}
                        >
                          将 {oicdData.provider || 'OICD'} 账号链接到已有账户
                        </button>
                        <button
                          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                          onClick={() => setAccountLinkChoice('new')}
                        >
                          使用 {oicdData.provider || 'OICD'} 邮箱创建新账户
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="font-medium">
                          {accountLinkChoice === 'existing' 
                            ? '链接到已有账户，请输入您的登录信息：' 
                            : '创建新账户，请设置密码：'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Show form when account link choice is made */}
            {accountLinkChoice && (
              <form onSubmit={handleSubmit}>
            {/* For existing account linking, only show username and password (login form) */}
            {accountLinkChoice === 'existing' ? (
              <>
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
                
                <div className="mb-6">
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
              </>
            ) : (
              // For new account creation, show full registration form
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
                    readOnly
                  />
                </div>
                
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
              </>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              {accountLinkChoice === 'existing' ? t('common.login') : t('common.register')}
            </button>
          </form>
            )}
          </div>
        )}
        
        {/* Show normal form when not in account linking mode */}
        {!needsAccountLink && (
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
        )}
        
        {/* OICD Provider Login */}
        {isLogin && oicdProviders.length > 0 && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-sm text-gray-500">
                  {t('common.or')}
                </span>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              {oicdProviders.map((provider) => (
                <button
                  key={provider.id}
                  className="w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md transition-colors"
                  onClick={() => {
                    // Redirect to OAuth2 login endpoint with统一的回调端点
                    window.location.href = `/api/oauth/login/${provider.name}?redirect_uri=${encodeURIComponent(window.location.origin + '/auth')}`;
                  }}
                >
                  <span>{t('common.loginWith')} {provider.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
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