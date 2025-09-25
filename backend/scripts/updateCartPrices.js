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
    // Get the collections directly
    const cartItems = await db.collection('cartitems').find({
      'productSnapshot.price': { $exists: false }
    }).toArray();
    
    console.log('Found', cartItems.length, 'cart items missing price');
    
    for (const item of cartItems) {
      if (item.product) {
        // Get the product data
        const product = await db.collection('products').findOne({ _id: item.product });
        
        if (product && product.variants && product.variants.length > 0) {
          const price = product.variants[0].price;
          console.log('Updating', item.productSnapshot.name, 'with price ₹', price);
          
          await db.collection('cartitems').updateOne(
            { _id: item._id },
            { $set: { 'productSnapshot.price': price } }
          );
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