import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, X } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/Products/ProductCard';

const FavoritesPage = () => {
  const { favorites, loading, error, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  
  const handleRemoveFromFavorites = (productId) => {
    toggleFavorite(productId);
  };
  
  const handleAddToCart = (product) => {
    addToCart(product);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[50vh] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Heart className="h-12 w-12 mx-auto text-rose-500 animate-pulse" />
          <h2 className="text-2xl font-medium mt-4 text-gray-700">Loading your favorites...</h2>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-red-100 rounded-lg mb-4">
            <p className="text-red-700">Error loading favorites. Please try again later.</p>
          </div>
          <Link to="/" className="text-rose-500 hover:text-rose-600 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-gray-800 flex items-center">
            <Heart className="h-8 w-8 mr-2 text-rose-500" />
            My Favorites
          </h1>
          <span className="text-gray-500 text-lg">
            {favorites.length} {favorites.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        {favorites.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center min-h-[40vh] flex flex-col items-center justify-center">
            <Heart className="h-16 w-16 mb-4 text-gray-300" />
            <h2 className="text-2xl font-medium text-gray-700 mb-4">Your favorites list is empty</h2>
            <p className="text-gray-500 max-w-lg mx-auto mb-6">
              Explore our products and add your favorite items to this list by clicking the heart icon on any product.
            </p>
            <Link 
              to="/products" 
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors duration-300"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <div key={favorite.productId} className="relative bg-white rounded-lg shadow-sm overflow-hidden group">
                <ProductCard product={favorite.productDetails} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;