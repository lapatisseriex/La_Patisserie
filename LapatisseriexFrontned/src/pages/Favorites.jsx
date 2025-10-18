import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useFavorites } from '../context/FavoritesContext/FavoritesContext';
import { useAuth } from '../hooks/useAuth';

import { fetchFavorites } from '../redux/favoritesSlice';
import { Heart } from 'lucide-react';
import ProductCard from '../components/Products/ProductCard';

const Favorites = () => {
  const { favorites, count, loading, error } = useFavorites();
  const { user } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) {
      // Only fetch if user has a valid token to avoid 500 errors
      const token = localStorage.getItem('authToken');
      if (token) {
        dispatch(fetchFavorites());
      }
    }
  }, [dispatch, user]);

  useEffect(() => {
    // Lightweight debug log
    console.log('Favorites state:', { favorites, count, loading, error });
  }, [favorites, count, loading, error]);

  // Empty state
  if (!loading && (!favorites || favorites.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-xl text-center space-y-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center border border-[#733857]/20">
            <Heart className="w-10 h-10 text-[#733857]" />
          </div>
          <h2 className="text-3xl font-light tracking-wide text-[#1a1a1a]">No favorites yet</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Save your top picks to keep them ready for your next craving.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 border border-[#733857] px-6 py-3 text-sm font-medium tracking-wide text-[#733857] transition-colors duration-300 hover:bg-[#733857] hover:text-white"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Favorites</h1>
          <div className="text-gray-600 font-medium">
            {count} {count === 1 ? 'item' : 'items'}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-gray-200 animate-pulse h-64 w-full"
              ></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favorites && favorites.length > 0 ? (
              favorites.map((item) => {
                // Support both shapes: { productId, productDetails } and direct product objects
                const productData = item?.productDetails || item;
                const productId = item?.productId || productData?._id || productData?.productId;

                if (!productData || !productId) return null;

                // Normalize images field
                const normalizedImages = (() => {
                  if (Array.isArray(productData.images) && productData.images.length) return productData.images;
                  const img = productData.image?.url || productData.image;
                  return img ? [img] : [];
                })();

                const normalizedProduct = {
                  _id: productId,
                  ...productData,
                  images: normalizedImages,
                  name: productData.name || 'Product',
                  description: productData.description || '',
                  variants: productData.variants || []
                };

                return (
                  <div key={productId} className="bg-white">
                    <ProductCard product={normalizedProduct} />
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-gray-600">No favorite products found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
