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
    // Get carts with items missing price in productSnapshot
    const carts = await db.collection('carts').find({
      'items.productSnapshot.price': { $exists: false }
    }).toArray();
    
    console.log('Found', carts.length, 'carts with items missing price');
    
    for (const cart of carts) {
      for (let i = 0; i < cart.items.length; i++) {
        const item = cart.items[i];
        
        if (!item.productSnapshot?.price && item.product) {
          // Get the product data
          const product = await db.collection('products').findOne({ _id: item.product });
          
          if (product && product.variants && product.variants.length > 0) {
            const price = product.variants[0].price;
            console.log('Updating', item.productSnapshot?.name || 'Unknown', 'with price ₹', price);
            
            await db.collection('carts').updateOne(
              { _id: cart._id },
              { $set: { [`items.${i}.productSnapshot.price`]: price } }
            );
          }
        }
      }
    }
    
    console.log('Update completed successfully');
  } catch (error) {
    console.error('Error updating cart prices:', error);
  } finally {
    process.exit(0);
  }
});