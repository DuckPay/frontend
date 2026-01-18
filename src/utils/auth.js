import axios from 'axios';

// Create axios instance with base URL and interceptors
const api = axios.create({
  baseURL: import.meta.env.MODE === 'production' 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : '/api',
});

// Add request interceptor to include token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth functions
export const login = async (username, password) => {
  try {
    const response = await api.post('/users/login', {
      username,
      password,
    });
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/users/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateUserInfo = async (userData) => {
  try {
    const response = await api.post('/users/me/update', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// OICD Provider functions
export const getEnabledOicdProviders = async () => {
  try {
    const response = await api.get('/oauth/providers/enabled');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const linkAccount = async (oicdData) => {
  try {
    const response = await api.post('/oauth/link-account', oicdData);
    // Save the access token from the response
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Permission check functions
/**
 * Check if a user belongs to a specific group
 * @param {Object} user - The user object
 * @param {string} groupName - The group name to check
 * @returns {boolean} - True if user belongs to the group, false otherwise
 */
export const hasGroup = (user, groupName) => {
  if (!user || !user.groups) return false;
  return user.groups.some(group => group.name === groupName);
};

/**
 * Check if a user is an admin
 * @param {Object} user - The user object
 * @returns {boolean} - True if user is an admin, false otherwise
 */
export const isAdmin = (user) => {
  if (!user || !user.groups) return false;
  // Check if user has any group with is_admin=true
  return user.groups.some(group => group.is_admin);
};

/**
 * Check if a user is an owner
 * @param {Object} user - The user object
 * @returns {boolean} - True if user is an owner, false otherwise
 */
export const isOwner = (user) => {
  return hasGroup(user, 'owner');
};

/**
 * Get the highest level (smallest number) of a user's groups
 * @param {Object} user - The user object
 * @returns {number} - The highest level (smallest number) of the user's groups
 */
export const getUserLevel = (user) => {
  if (!user || !user.groups || user.groups.length === 0) {
    return Infinity; // No groups, lowest possible level
  }
  // Find the smallest level (highest priority)
  return Math.min(...user.groups.map(group => group.level || Infinity));
};

/**
 * Check if current user can manage the target user based on group levels
 * @param {Object} currentUser - The current user
 * @param {Object} targetUser - The target user to check
 * @returns {boolean} - True if current user can manage the target user, false otherwise
 */
export const canManageUser = (currentUser, targetUser) => {
  if (isOwner(currentUser)) {
    return true; // Owner can manage any user
  }
  const currentLevel = getUserLevel(currentUser);
  const targetLevel = getUserLevel(targetUser);
  // Current user can manage target user if their level is lower or equal (higher or equal priority)
  return currentLevel <= targetLevel;
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - The user object
 * @param {string} permissionName - The permission name to check
 * @returns {boolean} - True if user has the permission, false otherwise
 */
export const hasPermission = (user, permissionName) => {
  if (!user || !user.groups) return false;
  
  // Owner has all permissions
  if (isOwner(user)) {
    return true;
  }
  
  // Helper function to check if user has a permission directly
  const hasDirectPermission = (permName) => {
    return user.groups.some(group => {
      return group.permissions && group.permissions.some(permission => {
        return permission.name === permName;
      });
    });
  };
  
  // Check permission relationships
  if (permissionName === 'edit_user') {
    // If user has any of the sub-permissions, they automatically have edit_user
    return hasDirectPermission('edit_user') || 
           hasDirectPermission('change_user_password') || 
           hasDirectPermission('change_user_info') || 
           hasDirectPermission('change_username');
  }
  
  // If user doesn't have edit_user, they can't have any of the sub-permissions
  if (!hasDirectPermission('edit_user') && 
      (permissionName === 'change_user_password' || 
       permissionName === 'change_user_info' || 
       permissionName === 'change_username')) {
    return false;
  }
  
  // Check if any group has the permission
  return hasDirectPermission(permissionName);
};

/**
 * Check if a user has any of the specified permissions
 * @param {Object} user - The user object
 * @param {Array} permissionNames - The list of permission names to check
 * @returns {boolean} - True if user has any of the permissions, false otherwise
 */
export const hasAnyPermission = (user, permissionNames) => {
  if (!user || !user.groups) return false;
  
  // Owner has all permissions
  if (isOwner(user)) {
    return true;
  }
  
  // Check if any of the requested permissions is granted
  return permissionNames.some(permissionName => hasPermission(user, permissionName));
};

// Custom hook for auth context
export const useAuth = () => {
  return {
    isAuthenticated: isAuthenticated(),
    login,
    register,
    logout,
    getCurrentUser,
    hasGroup,
    isAdmin,
    isOwner
  };
};

export default api;