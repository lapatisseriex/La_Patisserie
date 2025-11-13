import User from '../models/userModel.js';
import firebaseAdmin from '../config/firebase.js';

// Helper: retry with exponential backoff for transient write conflicts
async function runWithRetry(fn, { attempts = 3, baseDelayMs = 150 } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err?.message || '';
      const isTransient = (typeof err?.hasErrorLabel === 'function' && err.hasErrorLabel('TransientTransactionError'))
        || msg.includes('WriteConflict')
        || msg.includes('TransientTransactionError');
      if (!isTransient || i === attempts) break;
      const backoff = baseDelayMs * i; // linear backoff is enough here
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

// Build a filter for a model by inspecting common user reference paths
function buildUserFilter(Model, { userObjectId, uid }) {
  const paths = Model?.schema?.paths || {};
  if (paths.userId) return { userId: userObjectId };
  if (paths.user) return { user: userObjectId };
  if (paths.uid) return { uid };
  // Unknown mapping; skip by returning null
  return null;
}

// Delete user first, then related collections one by one (sequentially)
export async function deleteUserCascadeSequential(uid) {
  // Capture the user's ObjectId before deleting the user document
  const existing = await User.findOne({ uid }).select('_id').lean();
  const userObjectId = existing?._id;

  // Step 1: Delete the User document first (as requested)
  await runWithRetry(() => User.deleteOne({ uid }).exec(), { attempts: 3, baseDelayMs: 200 });

  // Step 2: Delete related collections sequentially
  const models = {};
  try { models.NewCart = (await import('../models/newCartModel.js')).default; } catch {}
  try { models.Order = (await import('../models/orderModel.js')).default; } catch {}
  try { models.Notification = (await import('../models/notificationModel.js')).default; } catch {}
  try { models.Favorite = (await import('../models/favoriteModel.js')).default; } catch {}
  try { models.Payment = (await import('../models/paymentModel.js')).default; } catch {}
  try { models.LoyaltyProgram = (await import('../models/loyaltyProgramModel.js')).default; } catch {}
  try { models.Newsletter = (await import('../models/newsletterModel.js')).default; } catch {}
  try { models.Donation = (await import('../models/donationModel.js')).default; } catch {}

  const order = [
    'NewCart',
    'Order',
    'Notification',
    'Favorite',
    'Payment',
    'LoyaltyProgram',
    'Newsletter',
    'Donation',
  ];

  const summary = { User: 1 };

  for (const name of order) {
    const Model = models[name];
    if (!Model) continue;
    const filter = buildUserFilter(Model, { userObjectId, uid });
    if (!filter) continue;

    const result = await runWithRetry(() => Model.deleteMany(filter).exec(), {
      attempts: 3,
      baseDelayMs: 250,
    });
    summary[name] = result?.deletedCount ?? 0;
  }

  // Step 3: Delete from Firebase Auth at the end (best-effort)
  try {
    await firebaseAdmin.auth().deleteUser(uid);
  } catch (fbErr) {
    console.error('Firebase user deletion error (continuing):', fbErr?.message || fbErr);
  }

  return summary;
}
