# Monthly Claim History Auto-Cleanup System

## Overview
Automatic monthly cleanup system that removes old free product claim history at the start of each new month. This keeps the database clean and ensures only current month data is retained.

## How It Works

### Automatic Cleanup
- **Schedule**: Runs daily at **00:01 AM (12:01 AM)** every day
- **Trigger**: Only executes cleanup on the **1st day of each month**
- **Action**: Removes all claim history records that are NOT from the current month
- **Result**: Only current month's claims remain in the database

### What Gets Cleaned
1. **Claim History**: `freeProductClaimHistory` array in user documents
   - Removes: All claims where `month !== currentMonth`
   - Keeps: Only claims from the current month (YYYY-MM format)

2. **Old Order Days**: `monthlyOrderDays` array (for safety)
   - Removes: Order days older than 2 months
   - Keeps: Last 2 months of order tracking data

## Technical Implementation

### Cron Job Configuration
```javascript
// Runs at 00:01 AM every day
cron.schedule('1 0 * * *', async () => {
  // Only runs on 1st day of month
  if (currentDay === 1) {
    // Execute cleanup
  }
});
```

### Database Operation
```javascript
// Remove all claims NOT from current month
await User.updateMany(
  { 'freeProductClaimHistory.0': { $exists: true } },
  {
    $pull: {
      freeProductClaimHistory: {
        month: { $ne: currentMonthKey } // e.g., "2025-11"
      }
    }
  }
);
```

## Files Created/Modified

### New Files
1. **`/backend/utils/monthlyCleanupJob.js`**
   - Main cleanup job logic
   - Exports: `startMonthlyCleanupJob()`, `runManualCleanup()`, `getCleanupStatus()`

2. **`/backend/scripts/testCleanup.js`**
   - Test script to verify cleanup works
   - Shows before/after comparison

3. **`/backend/scripts/addOldClaimsForTesting.js`**
   - Adds sample old claims for testing
   - Creates August, September, October test data

### Modified Files
1. **`/backend/server.js`**
   - Added import: `monthlyCleanupJob.js`
   - Added call: `startMonthlyCleanupJob()` after database connection

2. **`/backend/routes/adminRoutes.js`**
   - Added: `POST /api/admin/cleanup/run-manual` (trigger manual cleanup)
   - Added: `GET /api/admin/cleanup/status` (check cleanup status)

## Admin API Endpoints

### 1. Manual Cleanup Trigger
**Endpoint**: `POST /api/admin/cleanup/run-manual`  
**Auth**: Admin only  
**Purpose**: Force cleanup to run immediately (for testing or emergency)

**Response**:
```json
{
  "success": true,
  "message": "Manual cleanup completed successfully",
  "data": {
    "currentMonth": "2025-11",
    "usersProcessed": 5,
    "orderDaysCleaned": 12
  }
}
```

### 2. Cleanup Status
**Endpoint**: `GET /api/admin/cleanup/status`  
**Auth**: Admin only  
**Purpose**: Check when next cleanup will run

**Response**:
```json
{
  "success": true,
  "data": {
    "currentDate": "2025-11-02T10:30:00.000Z",
    "nextDailyCheck": "2025-11-03T00:01:00.000Z",
    "nextCleanupDate": "2025-12-01T00:01:00.000Z",
    "daysUntilCleanup": 29
  }
}
```

## Testing

### Test Scripts

#### 1. Add Old Claims
```bash
node scripts/addOldClaimsForTesting.js
```
Adds sample claims from August, September, October

#### 2. Test Cleanup
```bash
node scripts/testCleanup.js
```
Shows before/after comparison and removes old claims

### Test Results Example
```
📋 Current Claim History BEFORE Cleanup:
👤 User: Gokul an (angokul88@gmail.com)
   Claims: 4
   1. Month: 2025-11 - Strawberry Tiramisu
   2. Month: 2025-10 - October Product
   3. Month: 2025-09 - September Product
   4. Month: 2025-08 - August Product

🧹 Running Cleanup...

📋 Claim History AFTER Cleanup:
👤 User: Gokul an (angokul88@gmail.com)
   Claims: 1
   1. Month: 2025-11 - Strawberry Tiramisu

📊 Summary:
   Before: 5 total claims
   After: 2 total claims
   Removed: 3 old claims ✅
```

## Cleanup Schedule

### Monthly Timeline
```
November 1st, 00:01 AM → Cleanup runs
  - Removes: October, September, August... (all old months)
  - Keeps: November claims

November 2-30 → Cleanup checks daily but skips (not 1st day)

December 1st, 00:01 AM → Cleanup runs
  - Removes: November, October, September... (all old months)
  - Keeps: December claims
```

## Benefits

### Database Health
- ✅ Prevents unlimited growth of claim history
- ✅ Keeps database size manageable
- ✅ Improves query performance
- ✅ Reduces storage costs

### Data Management
- ✅ Automatically maintains current data
- ✅ No manual intervention required
- ✅ Consistent monthly reset
- ✅ Clear audit trail for current month

### User Experience
- ✅ Fresh start each month
- ✅ Clear monthly tracking
- ✅ No confusion with old data
- ✅ Accurate current status

## Logging

### Daily Check (Non-1st Day)
```
⏭️ Not the 1st of the month (Day 15) - Skipping cleanup
```

### Cleanup Day (1st of Month)
```
🗑️  Starting monthly claim history cleanup...
✅ Monthly cleanup completed!
   - Previous month: 2025-10
   - Current month: 2025-11
   - Users processed: 15
   - Old claim history removed successfully
   - Old order days cleaned: 23 users
```

### Manual Trigger
```
🔧 Running MANUAL claim history cleanup...
✅ Manual cleanup completed!
   - Current month: 2025-11
   - Users with claims cleaned: 12
   - Users with old order days cleaned: 18
```

## Configuration

### NPM Package
```json
{
  "dependencies": {
    "node-cron": "^3.0.3"
  }
}
```

### Environment Variables
No additional configuration needed - uses existing MongoDB connection

## Safety Features

1. **Non-Destructive**: Only removes OLD claims, preserves current month
2. **Idempotent**: Safe to run multiple times (won't delete current data)
3. **Manual Override**: Admin can trigger anytime via API
4. **Comprehensive Logging**: Full audit trail of all cleanup operations
5. **Error Handling**: Catches and logs errors without crashing server

## Monthly Reset Flow

### What Happens Each Month

#### During the Month (e.g., November)
- Users order on different days
- Progress tracked in `monthlyOrderDays`
- When 10 days reached → `freeProductEligible = true`
- When claimed → Record added to `freeProductClaimHistory`
- Claim includes: month: "2025-11"

#### On December 1st at 00:01 AM
1. **Cleanup Job Runs**
   - Finds all users with claim history
   - Removes claims where month !== "2025-12"
   - This removes ALL November claims

2. **User State Reset** (handled by `trackOrderDay` middleware)
   - `freeProductEligible = false`
   - `freeProductUsed = false`
   - `selectedFreeProductId = null`
   - `lastRewardMonth = null`
   - Old `monthlyOrderDays` cleaned

3. **Fresh Start**
   - Users begin with 0 order days
   - Can earn new reward in December
   - Clean history for reporting

## Admin Dashboard Impact

### Before Cleanup (November 30th)
- Shows November claims in table
- Stats include November data
- Top products from November

### After Cleanup (December 1st)
- November claims removed from table
- Stats reset (no claims yet in December)
- Empty state until first December claim

## Monitoring

### Check Cleanup Status
```bash
curl -X GET https://your-api.com/api/admin/cleanup/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Force Manual Cleanup (Testing)
```bash
curl -X POST https://your-api.com/api/admin/cleanup/run-manual \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Troubleshooting

### Cleanup Not Running?
1. Check server logs for daily checks
2. Verify cron job initialized in server.js
3. Check server timezone settings
4. Run manual cleanup via API

### Claims Not Being Removed?
1. Verify month format in database ("YYYY-MM")
2. Check console logs for errors
3. Test with `testCleanup.js` script
4. Verify database connection

### Need to Restore Old Data?
- Old claims are permanently deleted
- No backup/restore mechanism (by design)
- Keep database backups if historical data needed

## Future Enhancements (Optional)

1. **Historical Archive**: Export to separate collection before deletion
2. **Configurable Retention**: Keep last N months instead of just current
3. **Email Reports**: Send monthly cleanup summary to admins
4. **Analytics Export**: Generate reports before cleanup
5. **Soft Delete**: Mark as archived instead of permanent deletion

## Production Deployment

### Checklist
- [x] node-cron package installed
- [x] Cleanup job starts in server.js
- [x] Admin API endpoints secured
- [x] Logging enabled
- [x] Test scripts verified
- [x] Documentation complete

### Post-Deployment Verification
1. Check server logs for scheduled message
2. Wait for next 1st of month
3. Verify cleanup runs at 00:01 AM
4. Check logs for success message
5. Confirm old claims removed in database

---

**Status**: ✅ Active & Production Ready  
**Version**: 1.0.0  
**Last Updated**: November 2, 2025  
**Next Cleanup**: December 1, 2025 at 00:01 AM
