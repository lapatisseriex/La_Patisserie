# Product Order Tracking & Best Seller System

## Overview
This system tracks how many times each product has been ordered and automatically marks products as "best sellers" when they reach 4 or more total orders from all users combined.

## Features Implemented

### 🎯 Core Functionality
- **Order Count Tracking**: Each product now tracks `totalOrderCount` 
- **Best Seller Logic**: Products with 4+ total orders are marked as best sellers
- **Automatic Updates**: Order counts update when orders are confirmed or payments verified
- **Virtual Fields**: `bestSeller` virtual field for easy access

### 📊 New Database Fields
```javascript
// Added to Product Model
totalOrderCount: { type: Number, default: 0, min: 0 }
lastOrderCountUpdate: { type: Date, default: Date.now }

// Virtual field
bestSeller: Boolean (calculated from totalOrderCount >= 4)
```

### 🔄 Auto-Update Triggers
Order counts are automatically updated when:
1. **Razorpay Payment Verified** - `verifyPayment()` function
2. **COD Order Confirmed** - `updateOrderStatus()` when status changes to 'confirmed'

## New API Endpoints

### 📊 Product Order Statistics
```
GET /api/products/stats/orders
```
**Access**: Admin only  
**Purpose**: Get detailed order statistics for all products

**Query Parameters**:
- `sortBy` - Field to sort by (default: 'totalOrderCount')
- `order` - Sort order 'asc' or 'desc' (default: 'desc')
- `limit` - Number of products per page (default: 50)
- `page` - Page number (default: 1)
- `category` - Filter by category ID
- `minOrders` - Minimum order count filter

**Response**:
```json
{
  "products": [
    {
      "_id": "product_id",
      "name": "Chocolate Cake",
      "totalOrderCount": 15,
      "bestSeller": true,
      "category": { "name": "Cakes" },
      "featuredImage": "image_url"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalProducts": 100
  },
  "stats": {
    "totalProductsWithOrders": 45,
    "bestSellersCount": 12,
    "averageOrderCount": 2.3
  }
}
```

### 🏆 Best Selling Products
```
GET /api/products/bestsellers
```
**Access**: Public  
**Purpose**: Get all products marked as best sellers

**Query Parameters**:
- `limit` - Number of products per page (default: 20)
- `page` - Page number (default: 1)
- `category` - Filter by category ID
- `minOrders` - Override minimum orders threshold (default: 4)

**Response**:
```json
{
  "products": [
    {
      "_id": "product_id",
      "name": "Best Selling Cake",
      "totalOrderCount": 25,
      "bestSeller": true,
      "variants": [...],
      "category": { "name": "Cakes" }
    }
  ],
  "pagination": {...},
  "meta": {
    "minOrdersThreshold": 4,
    "resultCount": 15
  }
}
```

### 📈 Update Product Order Count
```
PUT /api/products/:id/order-count
```
**Access**: Admin only  
**Purpose**: Manually update a product's order count

**Body**:
```json
{
  "increment": 5,     // Add this many to current count
  "reset": false      // Or set to true to reset to 0
}
```

**Response**:
```json
{
  "_id": "product_id",
  "name": "Product Name",
  "totalOrderCount": 10,
  "bestSeller": true,
  "lastOrderCountUpdate": "2025-10-08T10:00:00Z"
}
```

### 🔄 Bulk Update All Order Counts
```
POST /api/products/bulk-update-order-counts
```
**Access**: Admin only  
**Purpose**: Recalculate all product order counts from existing order data

**Body**: None required

**Response**:
```json
{
  "message": "Bulk update completed successfully",
  "stats": {
    "totalOrdersProcessed": 150,
    "productsUpdated": 45,
    "totalProducts": 100,
    "bestSellers": 12,
    "bestSellerThreshold": 4
  },
  "summary": [
    {
      "id": "product_id",
      "name": "Product Name", 
      "totalOrderCount": 8,
      "bestSeller": true
    }
  ]
}
```

## Enhanced Product Listing

### 🛍️ Best Seller Filter
The main product listing endpoint now supports best seller filtering:

```
GET /api/products?bestSeller=true
```

This can be combined with other filters:
```
GET /api/products?bestSeller=true&category=cake_category_id&limit=10
```

### 📊 Additional Fields
All product responses now include:
- `totalOrderCount` - Number of times ordered
- `bestSeller` - Boolean indicating best seller status (virtual field)

## Product Model Methods

### New Methods Added
```javascript
// Check if product is best seller
product.isBestSeller() // Returns true if totalOrderCount >= 4

// Increment order count
product.incrementOrderCount(quantity) // Adds quantity to count and saves

// Virtual field access
product.bestSeller // Automatically calculated boolean
```

## Database Indexes
New indexes added for performance:
```javascript
{ totalOrderCount: -1 } // For best seller queries
{ totalOrderCount: -1, isActive: 1 } // Combined queries
```

## Usage Examples

### Admin Dashboard - View Order Statistics
```javascript
// Get top 20 most ordered products
fetch('/api/products/stats/orders?limit=20&sortBy=totalOrderCount&order=desc')

// Get products with at least 10 orders
fetch('/api/products/stats/orders?minOrders=10')
```

### Frontend - Show Best Sellers
```javascript
// Get best selling products for homepage
fetch('/api/products/bestsellers?limit=8')

// Filter best sellers in a category
fetch('/api/products/bestsellers?category=category_id')

// Alternative: Use main endpoint with filter
fetch('/api/products?bestSeller=true&limit=8')
```

### Admin - Bulk Update Counts
```javascript
// Recalculate all order counts from scratch
fetch('/api/products/bulk-update-order-counts', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer admin_token' }
})
```

## Migration
To populate order counts for existing products:
1. Use the bulk update endpoint: `POST /api/products/bulk-update-order-counts`
2. This will analyze all existing orders and update product counts accordingly

## Benefits
1. **Real-time Best Sellers**: Products automatically become best sellers as they reach 4 orders
2. **Marketing Insights**: Track which products are most popular
3. **User Experience**: Show customers what's popular/trending
4. **Admin Analytics**: Detailed statistics for business insights
5. **Performance**: Indexed queries for fast best seller lookups