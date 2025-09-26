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
    // Find carts with items missing price in productSnapshot
    const carts = await db.collection('carts').find({
      'items': {
        $elemMatch: {
          $or: [
            { 'productSnapshot.price': { $exists: false } },
            { 'productSnapshot.price': 0 },
            { 'productSnapshot.price': null }
          ]
        }
      }
    }).toArray();
    
    console.log(`Found ${carts.length} carts to fix`);
    
    for (const cart of carts) {
      let updated = false;
      
      for (let i = 0; i < cart.items.length; i++) {
        const item = cart.items[i];
        
        if (!item.productSnapshot?.price || item.productSnapshot.price === 0) {
          // Get the product
          const product = await db.collection('products').findOne({ 
            _id: new mongoose.Types.ObjectId(item.product) 
          });
          
          if (product && product.variants && product.variants.length > 0) {
            const price = product.variants[0].price;
            console.log(`Fixing ${item.productSnapshot?.name || 'Unknown'}: ₹${price}`);
            
            await db.collection('carts').updateOne(
              { _id: cart._id },
              { $set: { [`items.${i}.productSnapshot.price`]: price } }
            );
            updated = true;
          }
        }
      }
      
      if (updated) {
        console.log(`Updated cart for user: ${cart.user}`);
      }
    }
    
    console.log('Cart items updated successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
});