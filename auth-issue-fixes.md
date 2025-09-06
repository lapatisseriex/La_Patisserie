# Authentication Issue Fixes

## Problem
There was an issue with Firebase Phone Authentication where users who had deleted their account and tried to sign up again received an error:

```
E11000 duplicate key error collection: test.users index: phone_1 dup key: { phone: "+919361620860" }
```

This happened because Firebase creates a new authentication record with a new UID, but MongoDB still had the old user record with the same phone number.

## Solution

### 1. Enhanced Authentication Controller

Modified `authController.js` to:
- Add a helper function `resolveUserConflict()` to handle UID and phone number conflicts
- Better handle duplicate key errors during user creation
- Properly update existing users when Firebase UIDs change
- Ensure consistent location data population

### 2. User Recovery Script

Created a utility script `userRecovery.js` that can:
- Find users by phone number
- Update user UIDs when they change in Firebase
- Delete conflicting user records when needed

### 3. Duplicate User Cleanup

Created a database maintenance script `cleanupUsers.js` to:
- Find and remove duplicate user records
- Keep the oldest record when duplicates are found
- Maintain database integrity

## How It Works

The enhanced authentication flow now:

1. When a user authenticates with Firebase, we receive their UID and phone number
2. We check if a user with that UID or phone number already exists
3. If there's a conflict (same phone, different UID or vice versa), we resolve it by updating the existing record
4. Only create a new user if neither UID nor phone number exists in the database

## Manual Recovery Steps

If a similar issue occurs in the future:

1. Run the user recovery script to identify the problematic user:
   ```
   node scripts/userRecovery.js +919XXXXXXXXX
   ```

2. Delete the conflicting user if needed:
   ```
   node scripts/userRecovery.js +919XXXXXXXXX delete
   ```

3. Or update the UID to match the new Firebase UID:
   ```
   node scripts/userRecovery.js +919XXXXXXXXX new-firebase-uid
   ```
