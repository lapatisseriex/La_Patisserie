import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  productIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Static method to get user's favorites with product details
favoriteSchema.statics.getUserFavorites = async function(userId) {
  const favorites = await this.findOne({ userId }).lean();
  
  if (!favorites) {
    return {
      productIds: [],
      count: 0
    };
  }
  
  return {
    productIds: favorites.productIds,
    count: favorites.productIds.length
  };
};

// Static method to add product to favorites
favoriteSchema.statics.addToFavorites = async function(userId, productId) {
  // Find or create user's favorites
  let favorites = await this.findOne({ userId });
  
  if (!favorites) {
    favorites = new this({
      userId,
      productIds: []
    });
  }
  
  // Check if product already exists in favorites
  // Need to compare ObjectIds to string param safely
  const exists = favorites.productIds.some(id => id.toString() === productId.toString());
  if (!exists) {
    favorites.productIds.push(productId); // Will be cast to ObjectId by Mongoose
    favorites.updatedAt = Date.now();
    await favorites.save();
  }
  
  return favorites;
};

// Static method to remove product from favorites
favoriteSchema.statics.removeFromFavorites = async function(userId, productId) {
  const favorites = await this.findOne({ userId });
  
  if (!favorites) {
    return null;
  }
  
  // Remove product from favorites
  favorites.productIds = favorites.productIds.filter(id => id.toString() !== productId);
  favorites.updatedAt = Date.now();
  await favorites.save();
  
  return favorites;
};

// Static method to check if product is in favorites
favoriteSchema.statics.isProductInFavorites = async function(userId, productId) {
  const favorites = await this.findOne({ userId });
  
  if (!favorites) {
    return false;
  }
  
  return favorites.productIds.some(id => id.toString() === productId);
};

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;