import mongoose from 'mongoose';
import Cart from '../models/cartModel.js';

// Old CartItem schema for migration
const oldCartItemSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  productSnapshot: {
    name: String,
    price: Number,
    image: String,
    category: String
  }
}, {
  timestamps: true
});

const OldCartItem = mongoose.model('OldCartItem', oldCartItemSchema, 'cartitems');

async function migrateCartData() {
  try {
    console.log('🔄 Starting cart migration to single document per user...');
    
    // Get all old cart items grouped by user
    const oldCartItems = await OldCartItem.find({}).populate('product');
    
    if (oldCartItems.length === 0) {
      console.log('✅ No old cart items found. Migration not needed.');
      return;
    }
    
    // Group cart items by user
    const cartsByUser = {};
    oldCartItems.forEach(item => {
      if (!cartsByUser[item.user]) {
        cartsByUser[item.user] = [];
      }
      cartsByUser[item.user].push({
        product: item.product._id,
        quantity: item.quantity,
        productSnapshot: item.productSnapshot
      });
    });
    
    console.log(`📊 Found cart data for ${Object.keys(cartsByUser).length} users`);
    
    // Create new cart documents
    let migratedCount = 0;
    for (const [userId, items] of Object.entries(cartsByUser)) {
      try {
        // Check if user already has a new cart document
        const existingCart = await Cart.findOne({ user: userId });
        
        if (existingCart) {
          console.log(`⚠️ User ${userId} already has new cart format, skipping...`);
          continue;
        }
        
        // Create new cart document with all items
        await Cart.create({
          user: userId,
          items: items
        });
        
        migratedCount++;
        console.log(`✅ Migrated cart for user: ${userId} (${items.length} items)`);
      } catch (error) {
        console.error(`❌ Error migrating cart for user ${userId}:`, error.message);
      }
    }
    
    console.log(`🎉 Migration completed! Migrated ${migratedCount} user carts.`);
    
    // Ask for confirmation before deleting old data
    console.log('⚠️ Old cart items are still in the database.');
    console.log('💡 To remove them, run: db.cartitems.drop() in MongoDB shell after verifying the migration.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Connect to MongoDB
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/la_patisserie';
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('📦 Connected to MongoDB for migration');
      return migrateCartData();
    })
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateCartData };