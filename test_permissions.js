// Test permission functions
import { hasPermission, isOwner, isAdmin } from './src/utils/auth';

// Mock user with no permissions
const mockUser = {
  username: 'testuser',
  groups: [
    {
      name: 'user',
      is_admin: false,
      permissions: []
    }
  ]
};

// Mock admin user with some permissions
const mockAdminUser = {
  username: 'adminuser',
  groups: [
    {
      name: 'admin',
      is_admin: true,
      permissions: [
        { name: 'create_user', description: 'Create new users' },
        { name: 'edit_user', description: 'Edit existing users' },
        { name: 'delete_user', description: 'Delete users' }
      ]
    }
  ]
};

// Mock owner user with all permissions
const mockOwnerUser = {
  username: 'owneruser',
  groups: [
    {
      name: 'owner',
      is_admin: true,
      permissions: []
    }
  ]
};

// Test cases
console.log('Testing permission functions...');
console.log('==================================');

// Test isAdmin function
console.log('\nisAdmin tests:');
console.log(`mockUser is admin: ${isAdmin(mockUser)}`); // Should be false
console.log(`mockAdminUser is admin: ${isAdmin(mockAdminUser)}`); // Should be true
console.log(`mockOwnerUser is admin: ${isAdmin(mockOwnerUser)}`); // Should be true

// Test isOwner function
console.log('\nisOwner tests:');
console.log(`mockUser is owner: ${isOwner(mockUser)}`); // Should be false
console.log(`mockAdminUser is owner: ${isOwner(mockAdminUser)}`); // Should be false
console.log(`mockOwnerUser is owner: ${isOwner(mockOwnerUser)}`); // Should be true

// Test hasPermission function
console.log('\nhasPermission tests:');
console.log(`mockUser has create_user permission: ${hasPermission(mockUser, 'create_user')}`); // Should be false
console.log(`mockAdminUser has create_user permission: ${hasPermission(mockAdminUser, 'create_user')}`); // Should be true
console.log(`mockAdminUser has change_user_password permission: ${hasPermission(mockAdminUser, 'change_user_password')}`); // Should be false
console.log(`mockOwnerUser has change_user_password permission: ${hasPermission(mockOwnerUser, 'change_user_password')}`); // Should be true (owner has all permissions)

// Test hasPermission with different permissions
console.log('\nMore hasPermission tests:');
const permissions = [
  'create_user',
  'delete_user',
  'edit_user',
  'change_user_password',
  'change_user_info',
  'change_username',
  'manage_groups'
];

console.log('\nPermissions for mockAdminUser:');
permissions.forEach(permission => {
  console.log(`${permission}: ${hasPermission(mockAdminUser, permission)}`);
});

console.log('\nPermissions for mockOwnerUser:');
permissions.forEach(permission => {
  console.log(`${permission}: ${hasPermission(mockOwnerUser, permission)}`);
});

console.log('\n==================================');
console.log('Tests completed!');
