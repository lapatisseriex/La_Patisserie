// trimRecentlyViewed.js
// Script to trim all users' recentlyViewed list to the latest 3 items

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in environment');
  process.exit(1);
}

const sortByViewedAtDesc = (a, b) => {
  const ta = a?.viewedAt ? new Date(a.viewedAt).getTime() : 0;
  const tb = b?.viewedAt ? new Date(b.viewedAt).getTime() : 0;
  return tb - ta; // descending
};

const trimArray = (arr) => {
  if (!Array.isArray(arr)) return [];

  // Remove entries without productId
  const filtered = arr.filter((x) => x && x.productId);

  // Sort by viewedAt desc
  filtered.sort(sortByViewedAtDesc);

  // Deduplicate by productId (keep most recent occurrence)
  const seen = new Set();
  const deduped = [];
  for (const item of filtered) {
    const idStr = item.productId.toString();
    if (!seen.has(idStr)) {
      seen.add(idStr);
      deduped.push(item);
    }
  }

  // Keep only the latest 3
  return deduped.slice(0, 3);
};

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');

  const cursor = User.find({}, { recentlyViewed: 1 }).cursor();
  let checked = 0;
  let modified = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    checked += 1;
    const rv = doc.recentlyViewed || [];
    const trimmed = trimArray(rv);

    if (trimmed.length !== rv.length) {
      await User.updateOne({ _id: doc._id }, { $set: { recentlyViewed: trimmed } });
      modified += 1;
      if (modified % 50 === 0) {
        console.log(`Modified ${modified} users so far...`);
      }
    }
  }

  console.log(`Completed. Checked: ${checked}, Modified: ${modified}`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Error trimming recentlyViewed:', err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
