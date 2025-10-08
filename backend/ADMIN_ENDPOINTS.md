# Admin Panel API Endpoints

## 🔐 Authentication Required
All admin endpoints require:
- **Authentication**: `Authorization: Bearer <token>`
- **Admin Role**: User must have admin privileges

## 📊 **PRODUCT MANAGEMENT**

### Product CRUD Operations
```
POST   /api/products                    - Create new product
PUT    /api/products/:id               - Update product
DELETE /api/products/:id               - Delete product
PUT    /api/products/:id/discount      - Update product discount
```

### Product Analytics & Tracking
```
GET    /api/products/stats/orders      - Get product order statistics
PUT    /api/products/:id/order-count   - Update product order count
POST   /api/products/bulk-update-order-counts - Bulk update all order counts
```

## 📂 **CATEGORY MANAGEMENT**

### Category CRUD Operations
```
POST   /api/categories                 - Create new category
PUT    /api/categories/:id            - Update category
DELETE /api/categories/:id            - Delete category
```

### Category Image Management
```
POST   /api/categories/:id/reprocess-images    - Reprocess category images
PUT    /api/categories/special-image/:type     - Update special images
DELETE /api/categories/special-image/:type     - Delete special images
```

## 📦 **ORDER MANAGEMENT**

### Order Operations
```
GET    /api/payments/orders            - Get all orders (admin view)
GET    /api/payments/orders/:orderNumber - Get specific order details
PATCH  /api/payments/orders/:orderNumber/status - Update order status
```

**Order Status Values:**
- `placed` → `confirmed` → `preparing` → `ready` → `out_for_delivery` → `delivered`
- `cancelled` (can be set at any time)

## 👥 **USER MANAGEMENT**

### User Operations
```
GET    /api/admin/users               - Get all users
GET    /api/users                    - Get all users (alternative)
GET    /api/users/:id                - Get user by ID
```

## 📍 **LOCATION MANAGEMENT**

### Location CRUD Operations
```
GET    /api/admin/locations           - Get all locations
POST   /api/admin/locations          - Create new location
PUT    /api/admin/locations/:id      - Update location
PATCH  /api/admin/locations/:id/toggle - Toggle location active status
```

## ⏰ **TIME SETTINGS MANAGEMENT**

### Shop Hours & Availability
```
GET    /api/time-settings             - Get current time settings
PUT    /api/time-settings             - Update time settings
POST   /api/time-settings/special-day - Add special day (holiday/extended hours)
DELETE /api/time-settings/special-day/:date - Remove special day
```

## 📤 **MEDIA UPLOAD MANAGEMENT**

### File Upload Operations
```
POST   /api/upload                    - Upload media files
GET    /api/upload/signature          - Get upload signature for client-side uploads
```

## 🖼️ **IMAGE PROCESSING**

### Image Reprocessing
```
POST   /api/image-reprocess/:id/reprocess-images - Reprocess category images
```

---

## 📋 **REQUEST/RESPONSE EXAMPLES**

### Create Product
```javascript
POST /api/products
{
  "name": "Chocolate Cake",
  "description": "Delicious chocolate cake",
  "category": "category_id",
  "variants": [
    {
      "quantity": 500,
      "measuringUnit": "g",
      "price": 450,
      "costPrice": 200,
      "profitWanted": 150,
      "freeCashExpected": 100
    }
  ],
  "images": ["image_url_1", "image_url_2"],
  "isVeg": true,
  "hasEgg": true
}
```

### Update Order Status
```javascript
PATCH /api/payments/orders/ORD123456/status
{
  "orderStatus": "confirmed",
  "notes": "Order confirmed and being prepared"
}

Response:
{
  "success": true,
  "message": "Order status updated successfully",
  "order": {...},
  "emailNotification": {
    "sent": true,
    "messageId": "email_id"
  }
}
```

### Get Product Order Statistics
```javascript
GET /api/products/stats/orders?sortBy=totalOrderCount&order=desc&limit=20

Response:
{
  "products": [
    {
      "_id": "product_id",
      "name": "Best Selling Cake", 
      "totalOrderCount": 25,
      "bestSeller": true,
      "category": {"name": "Cakes"}
    }
  ],
  "pagination": {...},
  "stats": {
    "totalProductsWithOrders": 45,
    "bestSellersCount": 12,
    "averageOrderCount": 3.2
  }
}
```

### Create Location
```javascript
POST /api/admin/locations
{
  "name": "Downtown Store",
  "address": "123 Main St, City",
  "deliveryCharge": 50,
  "isActive": true,
  "coordinates": {
    "latitude": 12.9716,
    "longitude": 77.5946
  }
}
```

### Update Time Settings
```javascript
PUT /api/time-settings
{
  "shopHours": {
    "monday": {"open": "09:00", "close": "21:00", "isOpen": true},
    "tuesday": {"open": "09:00", "close": "21:00", "isOpen": true},
    // ... other days
  },
  "globalSettings": {
    "isShopOpen": true,
    "maintenanceMode": false
  }
}
```

---

## 🚀 **BULK OPERATIONS**

### Bulk Update Product Order Counts
```javascript
POST /api/products/bulk-update-order-counts

Response:
{
  "message": "Bulk update completed successfully",
  "stats": {
    "totalOrdersProcessed": 150,
    "productsUpdated": 45,
    "bestSellers": 12
  }
}
```

---

## 🔍 **FILTERING & PAGINATION**

Most GET endpoints support query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Field to sort by
- `order` - Sort order: 'asc' or 'desc'
- `category` - Filter by category ID
- `isActive` - Filter by active status

**Example:**
```
GET /api/products/stats/orders?page=2&limit=10&sortBy=totalOrderCount&order=desc&category=cake_category_id
```

---

## ⚡ **REAL-TIME FEATURES**

### Automatic Order Tracking
- Order counts automatically update when orders are confirmed
- Email notifications sent to customers on status changes
- Best seller status updates in real-time

### Cache Management
- Product listings are cached for performance
- Admin operations bypass cache for fresh data
- Cache automatically invalidates on updates

---

## 🛡️ **SECURITY NOTES**

1. **Authentication Required**: All admin endpoints require valid JWT token
2. **Role-Based Access**: Admin role verification on all operations
3. **Input Validation**: All inputs are validated and sanitized
4. **Error Handling**: Proper error responses with status codes
5. **Rate Limiting**: API rate limiting to prevent abuse

---

## 📈 **MONITORING & ANALYTICS**

Admin can monitor:
- **Product Performance**: Order counts, best sellers
- **Order Flow**: Status progression, completion rates  
- **User Activity**: Registration, order patterns
- **System Health**: Shop status, maintenance mode