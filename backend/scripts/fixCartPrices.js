// Simple script to fix cart prices
import mongoose from 'mongoose';

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/lapatisserie');

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('Connection error:', err);
  process.exit(1);
});

db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find cart items without price in productSnapshot
    const cartItems = await db.collection('cartitems').find({
      $or: [
        { 'productSnapshot.price': { $exists: false } },
        { 'productSnapshot.price': 0 },
        { 'productSnapshot.price': null }
      ]
    }).toArray();
    
    console.log(`Found ${cartItems.length} cart items to fix`);
    
    for (const item of cartItems) {
      // Get the product
      const product = await db.collection('products').findOne({ 
        _id: new mongoose.Types.ObjectId(item.product) 
      });
      
      if (product && product.variants && product.variants.length > 0) {
        const price = product.variants[0].price;
        console.log(`Fixing ${item.productSnapshot.name}: ₹${price}`);
        
        await db.collection('cartitems').updateOne(
          { _id: item._id },
          { $set: { 'productSnapshot.price': price } }
        );
      }
    }
    
    console.log('Cart items updated successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
});