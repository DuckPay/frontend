import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Settings, ArrowLeft, Shield } from 'lucide-react';
import api from '../utils/auth';
import { getCurrentUser, hasPermission, isOwner, canManageUser } from '../utils/auth';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';

// Admin panel component
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPermissionsGroup, setSelectedPermissionsGroup] = useState(null);
  const [groupPermissions, setGroupPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  
  // Form state for add/edit user
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    groups: ['user']
  });
  
  // Form state for add/edit group
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    isAdmin: false,
    isSystem: false,
    level: 5
  });
  
  // Fetch current user information
  const fetchCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      setError(err.message || 'Failed to fetch current user');
    }
  };
  
  // Fetch all users for admin panel
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Base URL is already set to /api in axios instance, so no need to add /api again
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all groups for admin panel
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/groups');
      setGroups(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize component
  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchGroups();
  }, []);

  // Fetch permissions when switching to addGroup tab
  useEffect(() => {
    if (activeTab === 'addGroup') {
      fetchAllPermissions();
      // Set showPermissions based on initial isAdmin state for new groups
      setShowPermissions(groupFormData.isAdmin);
    }
    // Also update showPermissions when switching to editGroup tab
    if (activeTab === 'editGroup') {
      setShowPermissions(groupFormData.isAdmin);
    }
  }, [activeTab, groups, groupFormData.isAdmin]);
  
  // Handle add group form submit
  const handleAddGroup = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!groupFormData.name) {
      setError('请填写组名称');
      return;
    }
    
    try {
      // Call API to add group
      const response = await api.post('/admin/groups/add', {
        name: groupFormData.name,
        description: groupFormData.description,
        is_admin: groupFormData.isAdmin,
        is_system: groupFormData.isSystem
      });
      
      // Get selected permission IDs
      const selectedPermissionIds = groupPermissions
        .filter(permission => permission.assigned)
        .map(permission => permission.id);
      
      // Update group permissions
      await api.post(`/admin/groups/${response.data.id}/permissions`, selectedPermissionIds);
      
      // Reset form and go back to groups tab
      setGroupFormData({
        name: '',
        description: '',
        isAdmin: false,
        isSystem: false
      });
      setActiveTab('groups');
      fetchGroups();
    } catch (err) {
      setError(err.message || '添加组失败');
    }
  };
  
  // Handle edit group form submit
  const handleEditGroup = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!groupFormData.name) {
      setError('请填写组名称');
      return;
    }
    
    try {
      // Prepare update data
      const updateData = {
        name: groupFormData.name,
        description: groupFormData.description,
        is_admin: groupFormData.isAdmin,
        is_system: groupFormData.isSystem
      };
      
      // Call API to update group
      const response = await api.post(`/admin/groups/update/${selectedGroup.id}`, updateData);
      
      // Get selected permission IDs
      const selectedPermissionIds = groupPermissions
        .filter(permission => permission.assigned)
        .map(permission => permission.id);
      
      // Update group permissions
      await api.post(`/admin/groups/${selectedGroup.id}/permissions`, selectedPermissionIds);
      
      // Reset form and go back to groups tab
      setGroupFormData({
        name: '',
        description: '',
        isAdmin: false,
        isSystem: false
      });
      setSelectedGroup(null);
      setActiveTab('groups');
      fetchGroups();
    } catch (err) {
      setError(err.message || '编辑组失败');
    }
  };
  
  // Handle edit group button click
  const handleEditGroupClick = async (group) => {
    setSelectedGroup(group);
    const isAdmin = group.is_admin || false;
    setGroupFormData({
      name: group.name,
      description: group.description || '',
      isAdmin: isAdmin,
      isSystem: group.is_system || false,
      level: group.level || 5
    });
    // Set showPermissions based on isAdmin status
    setShowPermissions(isAdmin);
    // Fetch group permissions when editing a group
    if (group.id) {
      await fetchGroupPermissions(group.id);
      // If not admin, uncheck all permissions
      if (!isAdmin) {
        setGroupPermissions(prev => prev.map(permission => ({
          ...permission,
          assigned: false
        })));
      }
    } else {
      // For new groups, clear permissions
      setGroupPermissions([]);
    }
    setActiveTab('editGroup');
  };
  
  // Handle delete group button click
  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('确定要删除这个组吗？')) {
      try {
        await api.post(`/admin/groups/delete/${groupId}`);
        fetchGroups();
      } catch (err) {
        setError(err.message || '删除组失败');
      }
    }
  };
  
  // Handle form input change
  const handleChange = (e) => {
    const { name, value, type, checked, form } = e.target;
    
    // Check which form we're dealing with based on the parent form's ID or the input's context
    const isUserForm = form && form.id === 'userForm' || !form;
    const isGroupForm = form && form.id === 'groupForm';
    const isOicdProviderForm = form && form.id === 'oicdProviderForm';
    
    if (isUserForm) {
      // Handle checkbox for groups in user form
      if (name === 'groups') {
        if (type === 'checkbox') {
          let updatedGroups = [...formData.groups];
          if (checked) {
            // Add the group if checked
            updatedGroups.push(value);
          } else {
            // Remove the group if unchecked
            updatedGroups = updatedGroups.filter(group => group !== value);
          }
          setFormData(prev => ({ ...prev, groups: updatedGroups }));
        }
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (isGroupForm) {
      // Handle group form input
      if (name === 'isAdmin' && type === 'checkbox') {
        // If isAdmin is unchecked, uncheck all permissions and hide permission checkboxes
        if (!checked) {
          // Uncheck all permissions
          setGroupPermissions(prev => prev.map(permission => ({
            ...permission,
            assigned: false
          })));
          // Hide permission checkboxes
          setShowPermissions(false);
        } else {
          // If isAdmin is checked, show permission checkboxes
          setShowPermissions(true);
        }
      }
      
      // Update group form data
      setGroupFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    } else if (isOicdProviderForm) {
      // Handle OICD provider form input
      if (name === 'name') {
        // When provider name changes, automatically update redirectUri
        const baseUrl = window.location.origin;
        const redirectUri = `${baseUrl}/api/oauth/callback/${value.toLowerCase()}`;
        setOicdProviderFormData(prev => ({
          ...prev,
          [name]: value,
          redirectUri: redirectUri
        }));
      } else {
        setOicdProviderFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
        }));
      }
    }
  };
  
  // Handle add user form submit
  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!formData.username || !formData.email || !formData.password) {
      setError('请填写所有必填字段');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('密码和确认密码不一致');
      return;
    }
    
    try {
      // Call API to add user with groups parameter
      const response = await api.post('/admin/users/add', {
        username: formData.username,
        email: formData.email,
        nickname: formData.nickname || formData.username,
        password: formData.password,
        groups: formData.groups
      });
      
      // Reset form and go back to users tab
      setFormData({
        username: '',
        email: '',
        nickname: '',
        password: '',
        confirmPassword: '',
        groups: ['user']
      });
      setActiveTab('users');
      fetchUsers();
    } catch (err) {
      setError(err.message || '添加用户失败');
    }
  };
  
  // Handle edit user form submit
  const handleEditUser = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!formData.username || !formData.email) {
      setError('请填写所有必填字段');
      return;
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('密码和确认密码不一致');
      return;
    }
    
    try {
      // Prepare update data
      const updateData = {
        username: formData.username,
        email: formData.email,
        nickname: formData.nickname,
        groups: formData.groups
      };
      
      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      // Call API to update user with groups parameter
      const response = await api.post(`/admin/users/update/${selectedUser.id}`, updateData);
      
      // Reset form and go back to users tab
      setFormData({
        username: '',
        email: '',
        nickname: '',
        password: '',
        confirmPassword: '',
        groups: ['user']
      });
      setSelectedUser(null);
      setActiveTab('users');
      fetchUsers();
    } catch (err) {
      setError(err.message || '编辑用户失败');
    }
  };
  
  // Handle edit user button click
  const handleEditUserClick = (user) => {
    setSelectedUser(user);
    // Get all user groups or default to ['user']
    const userGroups = user.groups && user.groups.length > 0 ? user.groups.map(group => group.name) : ['user'];
    setFormData({
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      password: '',
      confirmPassword: '',
      groups: userGroups
    });
    setActiveTab('editUser');
  };
  
  // Handle delete user button click
  const handleDeleteUser = async (userId) => {
    if (window.confirm('确定要删除这个用户吗？')) {
      try {
        await api.post(`/admin/users/delete/${userId}`);
        fetchUsers();
      } catch (err) {
        setError(err.message || '删除用户失败');
      }
    }
  };
  
  // Fetch permissions for a specific group
  const fetchGroupPermissions = async (groupId) => {
    try {
      setPermissionsLoading(true);
      const response = await api.get(`/admin/groups/${groupId}/permissions`);
      setGroupPermissions(response.data.permissions);
    } catch (err) {
      setError(err.message || 'Failed to fetch group permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Fetch all available permissions for a new group
  const fetchAllPermissions = async () => {
    try {
      setPermissionsLoading(true);
      // Get all permissions from the first group (since all groups have the same permission list)
      // This is a workaround - ideally there should be a separate API endpoint for all permissions
      if (groups.length > 0) {
        const response = await api.get(`/admin/groups/${groups[0].id}/permissions`);
        // For new groups, set all permissions to unassigned
        const allPermissions = response.data.permissions.map(permission => ({
          ...permission,
          assigned: false
        }));
        setGroupPermissions(allPermissions);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Handle permission checkbox change
  const handlePermissionChange = (permissionId) => {
    setGroupPermissions(prev => {
      // First, find the permission that was changed
      const changedPermission = prev.find(p => p.id === permissionId);
      const isBeingAssigned = !changedPermission.assigned;
      
      // Create a new permissions array with the initial change
      let updatedPermissions = prev.map(permission => {
        if (permission.id === permissionId) {
          return { ...permission, assigned: !permission.assigned };
        }
        return permission;
      });
      
      // Get edit_user permission
      const editUserPermission = updatedPermissions.find(p => p.name === 'edit_user');
      const changeUserPasswordPermission = updatedPermissions.find(p => p.name === 'change_user_password');
      const changeUserInfoPermission = updatedPermissions.find(p => p.name === 'change_user_info');
      const changeUsernamePermission = updatedPermissions.find(p => p.name === 'change_username');
      
      // Apply permission dependencies
      if (changedPermission.name === 'edit_user') {
        // If edit_user is being unassigned, unassign all sub-permissions
        if (!isBeingAssigned) {
          updatedPermissions = updatedPermissions.map(permission => {
            if (permission.name === 'change_user_password' || 
                permission.name === 'change_user_info' || 
                permission.name === 'change_username') {
              return { ...permission, assigned: false };
            }
            return permission;
          });
        }
      } else if (changedPermission.name === 'change_user_password' || 
                 changedPermission.name === 'change_user_info' || 
                 changedPermission.name === 'change_username') {
        // If any sub-permission is being assigned, assign edit_user
        if (isBeingAssigned) {
          updatedPermissions = updatedPermissions.map(permission => {
            if (permission.name === 'edit_user') {
              return { ...permission, assigned: true };
            }
            return permission;
          });
        } else {
          // If a sub-permission is being unassigned, check if any other sub-permissions are still assigned
          const anySubPermissionAssigned = 
            (changeUserPasswordPermission && changeUserPasswordPermission.assigned) ||
            (changeUserInfoPermission && changeUserInfoPermission.assigned) ||
            (changeUsernamePermission && changeUsernamePermission.assigned);
          
          // If no sub-permissions are assigned, unassign edit_user
          if (!anySubPermissionAssigned && editUserPermission) {
            updatedPermissions = updatedPermissions.map(permission => {
              if (permission.name === 'edit_user') {
                return { ...permission, assigned: false };
              }
              return permission;
            });
          }
        }
      }
      
      return updatedPermissions;
    });
  };

  // OICD Provider state
  const [oicdProviders, setOicdProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerLoading, setProviderLoading] = useState(true);
  
  // Form state for add/edit OICD provider
  const [oicdProviderFormData, setOicdProviderFormData] = useState({
    name: '',
    clientId: '',
    clientSecret: '',
    authorizationUrl: '',
    tokenUrl: '',
    userinfoUrl: '',
    redirectUri: '',
    scope: 'openid email profile',
    enabled: true
  });
  
  // Fetch all OICD providers
  const fetchOicdProviders = async () => {
    try {
      setProviderLoading(true);
      const response = await api.get('/oauth/providers');
      setOicdProviders(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch OICD providers');
    } finally {
      setProviderLoading(false);
    }
  };
  
  // Initialize component
  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchGroups();
    fetchOicdProviders();
  }, []);
  
  // Handle add OICD provider form submit
  const handleAddOicdProvider = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!oicdProviderFormData.name || !oicdProviderFormData.clientId || !oicdProviderFormData.clientSecret || 
        !oicdProviderFormData.authorizationUrl || !oicdProviderFormData.tokenUrl || !oicdProviderFormData.userinfoUrl) {
      setError('请填写所有必填字段');
      return;
    }
    
    try {
      // Call API to add OICD provider
      await api.post('/oauth/providers', {
        name: oicdProviderFormData.name,
        clientId: oicdProviderFormData.clientId,
        clientSecret: oicdProviderFormData.clientSecret,
        authorizationUrl: oicdProviderFormData.authorizationUrl,
        tokenUrl: oicdProviderFormData.tokenUrl,
        userinfoUrl: oicdProviderFormData.userinfoUrl,
        redirectUri: oicdProviderFormData.redirectUri,
        scope: oicdProviderFormData.scope,
        enabled: oicdProviderFormData.enabled
      });
      
      // Reset form and go back to OICD providers tab
      setOicdProviderFormData({
        name: '',
        clientId: '',
        clientSecret: '',
        authorizationUrl: '',
        tokenUrl: '',
        userinfoUrl: '',
        redirectUri: '',
        scope: 'openid email profile',
        enabled: true
      });
      setActiveTab('oicdProviders');
      fetchOicdProviders();
    } catch (err) {
      setError(err.message || '添加OICD Provider失败');
    }
  };
  
  // Handle edit OICD provider form submit
  const handleEditOicdProvider = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!oicdProviderFormData.name || !oicdProviderFormData.clientId || !oicdProviderFormData.clientSecret || 
        !oicdProviderFormData.authorizationUrl || !oicdProviderFormData.tokenUrl || !oicdProviderFormData.userinfoUrl) {
      setError('请填写所有必填字段');
      return;
    }
    
    try {
      // Call API to update OICD provider
      await api.put(`/oauth/providers/${selectedProvider.id}`, {
        name: oicdProviderFormData.name,
        clientId: oicdProviderFormData.clientId,
        clientSecret: oicdProviderFormData.clientSecret,
        authorizationUrl: oicdProviderFormData.authorizationUrl,
        tokenUrl: oicdProviderFormData.tokenUrl,
        userinfoUrl: oicdProviderFormData.userinfoUrl,
        redirectUri: oicdProviderFormData.redirectUri,
        scope: oicdProviderFormData.scope,
        enabled: oicdProviderFormData.enabled
      });
      
      // Reset form and go back to OICD providers tab
      setOicdProviderFormData({
        name: '',
        clientId: '',
        clientSecret: '',
        authorizationUrl: '',
        tokenUrl: '',
        userinfoUrl: '',
        redirectUri: '',
        scope: 'openid email profile',
        enabled: true
      });
      setSelectedProvider(null);
      setActiveTab('oicdProviders');
      fetchOicdProviders();
    } catch (err) {
      setError(err.message || '编辑OICD Provider失败');
    }
  };
  
  // Handle edit OICD provider button click
  const handleEditOicdProviderClick = (provider) => {
    setSelectedProvider(provider);
    setOicdProviderFormData({
      name: provider.name,
      clientId: provider.clientId,
      clientSecret: provider.clientSecret,
      authorizationUrl: provider.authorizationUrl,
      tokenUrl: provider.tokenUrl,
      userinfoUrl: provider.userinfoUrl,
      redirectUri: provider.redirectUri,
      scope: provider.scope,
      enabled: provider.enabled
    });
    setActiveTab('editOicdProvider');
  };
  
  // Handle delete OICD provider button click
  const handleDeleteOicdProvider = async (providerId) => {
    if (window.confirm('确定要删除这个OICD Provider吗？')) {
      try {
        await api.delete(`/oauth/providers/${providerId}`);
        fetchOicdProviders();
      } catch (err) {
        setError(err.message || '删除OICD Provider失败');
      }
    }
  };

  // Handle OIDC discovery URL auto-fill
  const handleOidcDiscovery = async () => {
    setError('');
    
    // Get discovery URL from input
    const discoveryUrlInput = document.getElementById('discoveryUrl');
    const discoveryUrl = discoveryUrlInput?.value?.trim();
    
    if (!discoveryUrl) {
      setError('请输入OIDC发现URL');
      return;
    }
    
    try {
      // Fetch OIDC discovery document
      const response = await fetch(discoveryUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const discoveryData = await response.json();
      
      // Update form data with discovered values
      setOicdProviderFormData(prev => ({
        ...prev,
        authorizationUrl: discoveryData.authorization_endpoint || prev.authorizationUrl,
        tokenUrl: discoveryData.token_endpoint || prev.tokenUrl,
        userinfoUrl: discoveryData.userinfo_endpoint || prev.userinfoUrl,
        scope: prev.scope || 'openid email profile' // Keep existing scope if provided, otherwise use default
      }));
      
      // Clear the discovery URL input after successful auto-fill
      discoveryUrlInput.value = '';
      
    } catch (err) {
      setError(`OIDC发现失败: ${err.message}`);
    }
  };
  
  // Dynamic tabs based on user groups and permissions
  const tabs = [
    { id: 'users', name: t('admin.userList'), icon: <Users size={20} /> },
    { id: 'addUser', name: t('admin.addUser'), icon: <UserPlus size={20} /> }
  ];
  
  // Add group management tabs only if user has manage_groups permission
  if (currentUser && (isOwner(currentUser) || hasPermission(currentUser, 'manage_groups'))) {
    tabs.push(
      { id: 'groups', name: t('admin.groupList'), icon: <Settings size={20} /> },
      { id: 'addGroup', name: t('admin.addGroup'), icon: <UserPlus size={20} /> }
    );
  }
  
  // Add OICD provider management tabs only if user has manage_oicd_providers permission
  if (currentUser && (isOwner(currentUser) || hasPermission(currentUser, 'manage_oicd_providers'))) {
    tabs.push(
      { id: 'oicdProviders', name: t('admin.oicdProviderList'), icon: <Shield size={20} /> },
      { id: 'addOicdProvider', name: t('admin.addOicdProvider'), icon: <UserPlus size={20} /> }
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <Header title={t('common.adminPanel')} />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex space-x-4 border-b">
            {/* Back button for edit user or edit group tab */}
            {(activeTab === 'editUser' || activeTab === 'editGroup') && (
              <button
                onClick={() => {
                  if (activeTab === 'editUser') {
                    setActiveTab('users');
                    setSelectedUser(null);
                    setFormData({
                      username: '',
                      email: '',
                      nickname: '',
                      password: '',
                      confirmPassword: '',
                      groups: ['user']
                    });
                  } else {
                    setActiveTab('groups');
                    setSelectedGroup(null);
                    setGroupFormData({
                      name: '',
                      description: '',
                      isAdmin: false,
                      isSystem: false
                    });
                  }
                }}
                className="flex items-center space-x-2 py-3 px-4 rounded-t-lg font-medium transition-colors text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={18} />
                <span>{t('common.back')}</span>
              </button>
            )}
            
            {/* Normal tabs */}
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
          {/* Error message */}
          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {/* Users tab */}
          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('admin.userList')}</h2>
              
              {/* Loading state */}
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">{t('common.loading')}</span>
                </div>
              ) : (
                /* Users table */
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.username')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.nickname')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.email')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.groups')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.registrationTime')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.nickname}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.groups && user.groups.length > 0 ? (
                              user.groups.map((group, index) => (
                                <span key={index} className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-1 mb-1 ${group.name === 'owner' ? 'bg-purple-100 text-purple-800' : group.name === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {group.name}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {t('common.normal')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {/* Edit button - check permissions and group level */}
                            {( 
                              // Check if current user has edit_user permission and can manage the target user
                              currentUser && hasPermission(currentUser, 'edit_user') && canManageUser(currentUser, user)
                            ) && (
                              <button 
                                className="text-blue-600 hover:text-blue-900 mr-4"
                                onClick={() => handleEditUserClick(user)}
                              >
                                {t('common.edit')}
                              </button>
                            )}
                            
                            {/* Delete button - check permissions and group level */}
                            {( 
                              // Check if current user has delete_user permission and can manage the target user
                              currentUser && hasPermission(currentUser, 'delete_user') && canManageUser(currentUser, user)
                            ) && (
                              <button 
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                {t('common.delete')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {/* Add User tab */}
          {(activeTab === 'addUser' || activeTab === 'editUser') && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {activeTab === 'addUser' ? t('admin.addUser') : t('admin.editUser')}
              </h2>
              
              <form onSubmit={activeTab === 'addUser' ? handleAddUser : handleEditUser} id="userForm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('common.username')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      disabled={!isOwner(currentUser) && !hasPermission(currentUser, 'change_username')}
                    />
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('common.email')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={!isOwner(currentUser) && !hasPermission(currentUser, 'change_user_info')}
                    />
                  </div>
                  
                  {/* Nickname */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('common.nickname')}
                    </label>
                    <input
                      type="text"
                      name="nickname"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.nickname}
                      onChange={handleChange}
                      placeholder={t('common.optional')}
                      disabled={!isOwner(currentUser) && !hasPermission(currentUser, 'change_user_info')}
                    />
                  </div>
                  
                  {/* Groups (multiple checkbox with Tailwind CSS Simple list with heading) */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('common.groups')} <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2 border border-gray-200 rounded-lg bg-white">
                      {/* All groups from API */}
                      {groups && groups.length > 0 && groups.map(group => (
                        <div key={group.id} className="flex items-center px-4 py-2 border-b border-gray-200">
                          <input
                            type="checkbox"
                            name="groups"
                            value={group.name}
                            checked={formData.groups.includes(group.name)}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={!isOwner(currentUser) && !hasPermission(currentUser, 'change_user_info')}
                          />
                          <label htmlFor={`group-${group.id}`} className="ml-3 block text-sm font-medium text-gray-700">
                            {group.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t('admin.selectUserGroups')}</p>
                  </div>
                  
                  {/* Password */}
                  {(isOwner(currentUser) || hasPermission(currentUser, 'change_user_password')) && (
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        {activeTab === 'addUser' ? t('common.password') : t('admin.newPassword')}{activeTab === 'addUser' && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="password"
                        name="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={activeTab === 'addUser' ? t('common.required') : t('admin.keepEmptyToNotChange')}
                        required={activeTab === 'addUser'}
                      />
                    </div>
                  )}
                  
                  {/* Confirm Password */}
                  {(isOwner(currentUser) || hasPermission(currentUser, 'change_user_password')) && (
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        {t('common.confirmPassword')}{activeTab === 'addUser' && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder={activeTab === 'addUser' ? t('common.required') : t('admin.keepEmptyToNotChange')}
                        required={activeTab === 'addUser'}
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                    {activeTab === 'addUser' ? t('admin.addUser') : t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('users');
                      setSelectedUser(null);
                    setFormData({
                      username: '',
                      email: '',
                      nickname: '',
                      password: '',
                      confirmPassword: '',
                      groups: ['user']
                    });
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Groups tab */}
          {activeTab === 'groups' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('admin.groupList')}</h2>
              
              {/* Loading state */}
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">{t('common.loading')}</span>
                </div>
              ) : (
                /* Groups table */
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.groupName')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.groupDescription')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.isAdminGroup')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider」">
                          {t('admin.isSystemGroup')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groups.map((group) => (
                        <tr key={group.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {group.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {group.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {group.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${group.is_admin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {group.is_admin ? t('common.yes') : t('common.no')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${group.is_system ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                              {group.is_system ? t('common.yes') : t('common.no')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {/* Edit button - only visible to owners */}
                            {currentUser && currentUser.groups && currentUser.groups.some(g => g.name === 'owner') && (
                              <button 
                                className="text-blue-600 hover:text-blue-900 mr-4"
                                onClick={() => handleEditGroupClick(group)}
                              >
                                {t('common.edit')}
                              </button>
                            )}
                            
                            {/* Delete button - only visible to owners and not for system groups */}
                            {currentUser && currentUser.groups && currentUser.groups.some(g => g.name === 'owner') && !group.is_system && (
                              <button 
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDeleteGroup(group.id)}
                              >
                                {t('common.delete')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {/* Add Group tab */}
          {(activeTab === 'addGroup' || activeTab === 'editGroup') && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {activeTab === 'addGroup' ? t('admin.addGroup') : t('admin.editGroup')}
              </h2>
              
              <form onSubmit={activeTab === 'addGroup' ? handleAddGroup : handleEditGroup} id="groupForm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Group Name */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('admin.groupName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={groupFormData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  {/* Group Description */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('admin.groupDescription')}
                    </label>
                    <input
                      type="text"
                      name="description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={groupFormData.description}
                      onChange={handleChange}
                      placeholder={t('common.optional')}
                    />
                  </div>
                  
                  {/* Is Admin Group */}
                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isAdmin"
                        id="isAdmin"
                        checked={groupFormData.isAdmin}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isAdmin" className="ml-3 block text-sm font-medium text-gray-700">
                        {t('admin.isAdminGroup')}
                      </label>
                    </div>
                  </div>
                  
                  {/* Is System Group */}
                <div className="md:col-span-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isSystem"
                      id="isSystem"
                      checked={groupFormData.isSystem}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isSystem" className="ml-3 block text-sm font-medium text-gray-700">
                      {t('admin.isSystemGroup')}
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{t('admin.cannotDeleteSystemGroup')}</p>
                </div>
                
                {/* Group Level */}
                <div className="md:col-span-1">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t('admin.groupLevel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="level"
                    min="0"
                    value={groupFormData.level}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={selectedGroup && selectedGroup.name === 'owner'}
                  />
                  <p className="mt-1 text-sm text-gray-500">{t('admin.groupLevelDescription')}</p>
                </div>
                </div>
                
                {/* Permissions section - only show if isAdmin is checked */}
                {showPermissions && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">{t('admin.managePermissions')}</h3>
                    
                    {/* Loading state */}
                    {permissionsLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-600">{t('common.loading')}</span>
                      </div>
                    ) : (
                      <div>
                        {/* Permissions by category */}
                        {(() => {
                          // Group permissions by category using a more compatible approach
                          const categories = { };
                          groupPermissions.forEach(permission => {
                            if (!categories[permission.category]) {
                              categories[permission.category] = [];
                            }
                            categories[permission.category].push(permission);
                          });
                          
                          return Object.entries(categories).map(([category, permissions]) => (
                            <div key={category} className="mb-6">
                              <h4 className="text-md font-semibold text-gray-800 mb-3 capitalize">
                                {category.replace('_', ' ')}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {permissions.map(permission => (
                                  <div key={permission.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                                    <input
                                      type="checkbox"
                                      id={`permission-${permission.id}`}
                                      checked={permission.assigned}
                                      onChange={() => handlePermissionChange(permission.id)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label 
                                      htmlFor={`permission-${permission.id}`} 
                                      className="ml-3 block text-sm font-medium text-gray-700"
                                    >
                                      <div className="font-semibold">{permission.name.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}</div>
                                      <div className="text-gray-500 text-xs">{permission.description}</div>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-6 flex space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                    {activeTab === 'addGroup' ? t('admin.addGroup') : t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('groups');
                      setSelectedGroup(null);
                      setGroupFormData({
                        name: '',
                        description: '',
                        isAdmin: false,
                        isSystem: false
                      });
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* OICD Providers tab */}
          {activeTab === 'oicdProviders' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('admin.oicdProviderList')}</h2>
              
              {/* Loading state */}
              {providerLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">{t('common.loading')}</span>
                </div>
              ) : (
                /* OICD Providers table */
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.providerName')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.clientId')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.enabled')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.registrationTime')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {oicdProviders.map((provider) => (
                        <tr key={provider.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {provider.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {provider.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {provider.clientId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${provider.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {provider.enabled ? t('common.yes') : t('common.no')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(provider.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {/* Edit button */}
                            <button 
                              className="text-blue-600 hover:text-blue-900 mr-4"
                              onClick={() => handleEditOicdProviderClick(provider)}
                            >
                              {t('common.edit')}
                            </button>
                            
                            {/* Delete button */}
                            <button 
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeleteOicdProvider(provider.id)}
                            >
                              {t('common.delete')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {/* Add/Edit OICD Provider tab */}
          {(activeTab === 'addOicdProvider' || activeTab === 'editOicdProvider') && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {activeTab === 'addOicdProvider' ? t('admin.addOicdProvider') : t('admin.editOicdProvider')}
              </h2>
              
              <form onSubmit={activeTab === 'addOicdProvider' ? handleAddOicdProvider : handleEditOicdProvider} id="oicdProviderForm">
                {/* OIDC Discovery URL section */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">{t('admin.oidcDiscovery')}</h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        {t('admin.discoveryUrl')}
                      </label>
                      <input
                        type="url"
                        id="discoveryUrl"
                        placeholder="https://example.com/.well-known/openid-configuration"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleOidcDiscovery}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                      >
                        {t('admin.autoFill')}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {t('admin.discoveryUrlHint')}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Provider Name */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('admin.providerName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={oicdProviderFormData.name}
                      onChange={(e) => setOicdProviderFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* Client ID */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('admin.clientId')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="clientId"
                      value={oicdProviderFormData.clientId}
                      onChange={(e) => setOicdProviderFormData(prev => ({ ...prev, clientId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* Client Secret */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('admin.clientSecret')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="clientSecret"
                      value={oicdProviderFormData.clientSecret}
                      onChange={(e) => setOicdProviderFormData(prev => ({ ...prev, clientSecret: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* Authorization URL */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('admin.authorizationUrl')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      name="authorizationUrl"
                      value={oicdProviderFormData.authorizationUrl}
                      onChange={(e) => setOicdProviderFormData(prev => ({ ...prev, authorizationUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* Token URL */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('admin.tokenUrl')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      name="tokenUrl"
                      value={oicdProviderFormData.tokenUrl}
                      onChange={(e) => setOicdProviderFormData(prev => ({ ...prev, tokenUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* User Info URL */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('admin.userinfoUrl')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      name="userinfoUrl"
                      value={oicdProviderFormData.userinfoUrl}
                      onChange={(e) => setOicdProviderFormData(prev => ({ ...prev, userinfoUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* Redirect URI */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('admin.redirectUri')}
                    </label>
                    <input
                      type="url"
                      name="redirectUri"
                      value={oicdProviderFormData.redirectUri}
                      onChange={(e) => setOicdProviderFormData(prev => ({ ...prev, redirectUri: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {t('admin.redirectUriHint')}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {t('admin.redirectUriExample')}
                    </p>
                  </div>
                  
                  {/* Scope */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t('admin.scope')}
                    </label>
                    <input
                      type="text"
                      name="scope"
                      value={oicdProviderFormData.scope}
                      onChange={(e) => setOicdProviderFormData(prev => ({ ...prev, scope: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Enabled */}
                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="enabled"
                        id="enabled"
                        checked={oicdProviderFormData.enabled}
                        onChange={(e) => setOicdProviderFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="enabled" className="ml-3 block text-sm font-medium text-gray-700">
                        {t('admin.enabled')}
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                    {activeTab === 'addOicdProvider' ? t('admin.addOicdProvider') : t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('oicdProviders');
                      setSelectedProvider(null);
                      setOicdProviderFormData({
                        name: '',
                        clientId: '',
                        clientSecret: '',
                        authorizationUrl: '',
                        tokenUrl: '',
                        userinfoUrl: '',
                        redirectUri: '',
                        scope: 'openid email profile',
                        enabled: true
                      });
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminPanel;
