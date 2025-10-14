import React from 'react';
import { motion } from 'framer-motion';

const ProductDisplaySkeleton = () => {
  // Animation variants for skeleton shimmer effect
  const shimmerVariants = {
    initial: { backgroundPosition: '200% 0' },
    animate: {
      backgroundPosition: '-200% 0',
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  // Skeleton component with shimmer effect
  const SkeletonElement = ({ className, ...props }) => (
    <motion.div
      className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded-lg ${className}`}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      style={{
        backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%'
      }}
      {...props}
    />
  );

  return (
    <div className="min-h-scree">
      {/* Mobile Back Button Skeleton */}
      <div className="md:hidden">
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-pink-100 p-4">
          <SkeletonElement className="w-8 h-8 rounded-full" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Desktop Breadcrumb Skeleton */}
        <div className="hidden md:block mb-6">
          <div className="flex items-center space-x-2">
            <SkeletonElement className="w-16 h-4" />
            <SkeletonElement className="w-4 h-4 rounded-full" />
            <SkeletonElement className="w-20 h-4" />
            <SkeletonElement className="w-4 h-4 rounded-full" />
            <SkeletonElement className="w-24 h-4" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Section Skeleton */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <SkeletonElement className="w-full aspect-square rounded-2xl shadow-2xl" />
              
              {/* Image Controls */}
              <div className="absolute bottom-4 left-4 flex space-x-2">
                <SkeletonElement className="w-10 h-10 rounded-full" />
                <SkeletonElement className="w-10 h-10 rounded-full" />
              </div>
            </motion.div>

            {/* Thumbnail Images */}
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {[...Array(4)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <SkeletonElement className="w-20 h-20 rounded-xl flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Product Info Section Skeleton */}
          <div className="space-y-6">
            {/* Product Title */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-3"
            >
              <SkeletonElement className="w-3/4 h-8" />
              <SkeletonElement className="w-1/2 h-6" />
            </motion.div>

            {/* Rating Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center space-x-4"
            >
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <SkeletonElement key={i} className="w-5 h-5 rounded" />
                ))}
              </div>
              <SkeletonElement className="w-20 h-4" />
              <SkeletonElement className="w-16 h-4" />
            </motion.div>

            {/* Price Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-2"
            >
              <SkeletonElement className="w-32 h-10" />
              <SkeletonElement className="w-24 h-4" />
            </motion.div>

            {/* Variants Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-3"
            >
              <SkeletonElement className="w-20 h-5" />
              <div className="flex space-x-3">
                {[...Array(3)].map((_, index) => (
                  <SkeletonElement key={index} className="w-24 h-10 rounded-lg" />
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-4">
                <SkeletonElement className="w-32 h-12 rounded-full" />
                <SkeletonElement className="w-12 h-12 rounded-full" />
                <SkeletonElement className="w-12 h-12 rounded-full" />
              </div>
              <SkeletonElement className="w-full h-14 rounded-full" />
            </motion.div>

            {/* Features Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="space-y-4"
            >
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <SkeletonElement className="w-6 h-6 rounded-full" />
                  <SkeletonElement className="w-40 h-4" />
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Description Section Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 space-y-6"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-pink-100">
            <SkeletonElement className="w-32 h-6 mb-4" />
            <div className="space-y-3">
              <SkeletonElement className="w-full h-4" />
              <SkeletonElement className="w-5/6 h-4" />
              <SkeletonElement className="w-4/6 h-4" />
            </div>
          </div>
        </motion.div>

        {/* Related Products Section Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-12 space-y-6"
        >
          <SkeletonElement className="w-48 h-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-pink-100"
              >
                <SkeletonElement className="w-full aspect-square rounded-xl mb-4" />
                <SkeletonElement className="w-3/4 h-5 mb-2" />
                <SkeletonElement className="w-1/2 h-4 mb-3" />
                <SkeletonElement className="w-20 h-6" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Mobile Sticky Bar Skeleton */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/90 backdrop-blur-md border-t border-pink-100 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SkeletonElement className="w-16 h-4" />
              <SkeletonElement className="w-24 h-6" />
            </div>
            <SkeletonElement className="w-32 h-12 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDisplaySkeleton;