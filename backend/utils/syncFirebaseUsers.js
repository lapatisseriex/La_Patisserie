import firebaseAdmin from '../config/firebase.js';
import User from '../models/userModel.js';
import database from './database.js';

/**
 * Utility script to sync Firebase users to the database
 * Run this if you have Firebase users that aren't in your database
 */

const syncFirebaseUsers = async () => {
  try {
    console.log('Starting Firebase user sync...');
    
    // Connect to database
    await database.connect();
    
    // Get all users from Firebase (max 1000 at a time)
    let nextPageToken;
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    
    do {
      const listUsersResult = await firebaseAdmin.auth().listUsers(1000, nextPageToken);
      
      for (const firebaseUser of listUsersResult.users) {
        const { uid, email, displayName, photoURL, emailVerified } = firebaseUser;
        
        if (!email) {
          console.log(`Skipping user ${uid} - no email`);
          continue;
        }
        
        try {
          // Check if user exists in database
          let dbUser = await User.findOne({ uid });
          
          if (!dbUser) {
            // Check by email too
            dbUser = await User.findOne({ email });
            
            if (dbUser) {
              // User exists with email but different UID - update UID
              console.log(`Updating UID for user ${email}: ${dbUser.uid} -> ${uid}`);
              dbUser.uid = uid;
              await dbUser.save();
              totalUpdated++;
            } else {
              // Create new user
              console.log(`Creating new user: ${email} (${uid})`);
              
              const userData = {
                uid,
                email,
                name: displayName || null,
                profilePhoto: photoURL ? { url: photoURL, public_id: '' } : { url: '', public_id: '' },
                role: email === 'admin@lapatisserie.com' ? 'admin' : 'user',
                emailVerified: emailVerified || false,
                lastLogin: new Date(),
                lastActive: new Date(),
                isActive: true
              };
              
              await User.create(userData);
              totalCreated++;
            }
          } else {
            // User exists - ensure they're active and update email verification
            if (!dbUser.isActive || dbUser.emailVerified !== emailVerified) {
              console.log(`Updating existing user: ${email}`);
              dbUser.isActive = true;
              dbUser.emailVerified = emailVerified;
              await dbUser.save();
              totalUpdated++;
            }
          }
        } catch (userError) {
          console.error(`Error processing user ${uid}:`, userError);
        }
        
        totalProcessed++;
      }
      
      nextPageToken = listUsersResult.pageToken;
      
    } while (nextPageToken);
    
    console.log(`Sync completed. Processed: ${totalProcessed}, Created: ${totalCreated}, Updated: ${totalUpdated}`);
    
  } catch (error) {
    console.error('Error syncing Firebase users:', error);
  }
};

// If running directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('syncFirebaseUsers.js')) {
  syncFirebaseUsers()
    .then(() => {
      console.log('Sync completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Sync failed:', error);
      process.exit(1);
    });
}

export default syncFirebaseUsers;