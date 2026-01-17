// Test to check current user permissions
import { getCurrentUser } from './src/utils/auth';

async function testCurrentUserPermissions() {
  try {
    console.log('Fetching current user...');
    const user = await getCurrentUser();
    
    console.log('Current user:', user.username);
    console.log('Groups:', user.groups);
    
    // Check each group's structure
    user.groups.forEach((group, index) => {
      console.log(`\nGroup ${index + 1}:`);
      console.log(`  Name: ${group.name}`);
      console.log(`  is_admin: ${group.is_admin}`);
      console.log(`  has permissions: ${group.permissions ? 'Yes' : 'No'}`);
      
      if (group.permissions) {
        console.log('  Permissions:', group.permissions.map(p => p.name));
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
  }
}

testCurrentUserPermissions();