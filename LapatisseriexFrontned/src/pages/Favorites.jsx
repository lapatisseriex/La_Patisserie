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
      <div className="min-h-screen flex items-center justify-center ">
        <div className="max-w-lg w-full p-8 bg-white ">
          <div className="flex flex-col items-center">
            <Heart className="w-14 h-14 text-rose-500 mb-4" />
            <h2 className="text-3xl font-semibold mb-2 text-gray-900">No Favorites Yet</h2>
            <p className="text-gray-600 mb-6 text-center">
              Add your favorite cakes & desserts here to view them later.
            </p>
            <Link
              to="/products"
              className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 font-medium transition duration-300"
            >
              Browse Products
            </Link>
          </div>
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
