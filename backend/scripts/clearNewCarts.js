import 'dotenv/config';
import mongoose from 'mongoose';
import dbConnection from '../utils/database.js';
import NewCart from '../models/newCartModel.js';

async function main() {
  try {
    const args = new Set(process.argv.slice(2));
    const force = args.has('--force') || process.env.FORCE === '1';

    if (!force) {
      console.error('Refusing to delete all documents from newCarts without confirmation.');
      console.error('Run with --force or set FORCE=1 to proceed.');
      console.error('Example: node scripts/clearNewCarts.js --force');
      process.exit(1);
    }

    // Connect to MongoDB
    await dbConnection.connect();

    // Delete all cart documents
    const result = await NewCart.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount ?? 0} document(s) from the newCarts collection.`);

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Done.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to clear newCarts collection:', err?.message || err);
    try { await mongoose.connection.close(); } catch {}
    process.exit(1);
  }
}

main();
