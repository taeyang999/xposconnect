/**
 * Syncs User data to Profile entity
 * This function should be called when a User is created or updated
 */
export default async function syncUserToProfile({ user_id, action }, { base44 }) {
  try {
    const user = await base44.asServiceRole.entities.User.filter({ id: user_id });
    
    if (!user || user.length === 0) {
      return { success: false, error: 'User not found' };
    }

    const userData = user[0];
    
    const profileData = {
      user_id: userData.id,
      email: userData.email,
      firstname: userData.firstname || '',
      lastname: userData.lastname || '',
      full_name: userData.full_name || '',
      status: userData.status || 'active',
    };

    // Check if profile already exists
    const existingProfiles = await base44.asServiceRole.entities.Profile.filter({ user_id: userData.id });

    if (existingProfiles && existingProfiles.length > 0) {
      // Update existing profile
      await base44.asServiceRole.entities.Profile.update(existingProfiles[0].id, profileData);
    } else {
      // Create new profile
      await base44.asServiceRole.entities.Profile.create(profileData);
    }

    return { success: true };
  } catch (error) {
    console.error('Error syncing user to profile:', error);
    return { success: false, error: error.message };
  }
}