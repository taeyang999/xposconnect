/**
 * One-time migration to sync all existing Users to Profile entity
 * Call this function once to populate the Profile entity with existing user data
 */
export default async function migrateUsersToProfiles(params, { base44 }) {
  try {
    // Fetch all users using service role
    const users = await base44.asServiceRole.entities.User.list();
    
    if (!users || users.length === 0) {
      return { 
        success: true, 
        message: 'No users found to migrate',
        created: 0,
        updated: 0,
        skipped: 0
      };
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Process each user
    for (const user of users) {
      try {
        const profileData = {
          user_id: user.id,
          email: user.email,
          firstname: user.firstname || '',
          lastname: user.lastname || '',
          full_name: user.full_name || '',
          status: user.status || 'active',
        };

        // Check if profile already exists
        const existingProfiles = await base44.asServiceRole.entities.Profile.filter({ 
          user_id: user.id 
        });

        if (existingProfiles && existingProfiles.length > 0) {
          // Update existing profile
          await base44.asServiceRole.entities.Profile.update(
            existingProfiles[0].id, 
            profileData
          );
          updated++;
        } else {
          // Create new profile
          await base44.asServiceRole.entities.Profile.create(profileData);
          created++;
        }
      } catch (error) {
        console.error(`Failed to process user ${user.email}:`, error);
        skipped++;
      }
    }

    return {
      success: true,
      message: `Migration completed successfully`,
      total: users.length,
      created,
      updated,
      skipped
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      success: false,
      error: error.message,
      created: 0,
      updated: 0,
      skipped: 0
    };
  }
}