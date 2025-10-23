# La Patisserie X - Authentication System

This repository contains both the frontend and backend code for the La Patisserie X authentication system using Firebase Google Sign-In, Email/Password Authentication, Firebase Admin SDK, and MongoDB with role-based access.

## Project Structure

```
LapatisseriexFrontned/ - React frontend with Vite & Tailwind CSS
backend/             - Node.js Express backend API
```

## Frontend

### Technologies Used
- React 19 with Vite
- Tailwind CSS for styling
- Firebase Web SDK for Phone Authentication
- Axios for API requests
- React Router DOM for routing

### Features
- Google Sign-In and Email/Password authentication with Firebase
- Email verification using OTP (in profile settings)
- New user profile creation
- Role-based UI (admin vs regular user)
- Protected routes for authenticated users and admins

### Setup

1. Navigate to the frontend directory:
```
cd LapatisseriexFrontned
```

2. Install dependencies:
```
npm install
```

3. Copy the `.env.example` file to `.env` and update with your Firebase configuration:
```
cp .env.example .env
```

4. Update the `.env` file with your Firebase configuration

5. Run the development server:
```
npm run dev
```

## Backend

### Technologies Used
- Node.js with Express
- Firebase Admin SDK for token verification
- MongoDB with Mongoose for user data storage
- JSON Web Token for authentication

### Features
- Firebase ID token verification
- User creation and management
- Role-based access control
- Protected API endpoints

### Cart API (DB-backed)

The cart is persisted in MongoDB (not in cache) using the `NewCart` model. Each user has exactly one cart identified by their Firebase UID. Cart items embed a `productId` reference to `Product` and include quantity, an `addedAt` timestamp, and a product snapshot for stable display.

Key fields stored:
- userId: string (Firebase UID) — unique per cart
- items[].productId: ObjectId ref to Product
- items[].quantity: number (>= 1)
- items[].addedAt: Date
- items[].productDetails: snapshot fields for UI and pricing (name, price, image, category, hasEgg, variantIndex, variants[], selectedVariant)
- timestamps: createdAt/updatedAt on both cart and items

Endpoints (all require Authorization: Bearer <Firebase ID token>):
- GET /api/newcart — Get current user's cart with product snapshot
- GET /api/newcart/count — Get total item count
- POST /api/newcart — Add/update an item
	- body: { productId: string, quantity?: number = 1, variantIndex?: number = 0 }
- PUT /api/newcart/:productId — Set absolute quantity for a product
	- body: { quantity: number }
- DELETE /api/newcart/:productId — Remove a product from cart
- DELETE /api/newcart — Clear entire cart

Notes:
- Stock is validated (when variant tracks stock) but not decremented on add-to-cart. Stock is decremented during order completion.
- Product details are refreshed on GET to reflect the latest product state (e.g., price/images), while preserving the selected variant.

Sample add-to-cart request:

```
POST /api/newcart
Authorization: Bearer <token>
Content-Type: application/json

{
	"productId": "6741c9d9a3...",
	"quantity": 2,
	"variantIndex": 0
}
```

Sample response (abridged):

```
{
	"_id": "...",
	"userId": "firebase-uid",
	"items": [
		{
			"productId": "6741c9d9a3...",
			"quantity": 2,
			"productDetails": {
				"name": "Chocolate Cake",
				"price": 499,
				"image": "https://...",
				"category": "Cakes",
				"hasEgg": false,
				"variantIndex": 0,
				"variants": [ ... ],
				"selectedVariant": { ... }
			},
			"addedAt": "2025-10-23T06:11:00.000Z"
		}
	],
	"cartTotal": 998,
	"cartCount": 2,
	"lastUpdated": "2025-10-23T06:11:00.000Z"
}
```

### Setup

1. Navigate to the backend directory:
```
cd backend
```

2. Install dependencies:
```
npm install
```

3. Copy the `.env.example` file to `.env` and update with your configuration:
```
cp .env.example .env
```

4. Update the `.env` file with your Firebase Admin SDK credentials and MongoDB URI

5. Run the development server:
```
npm run dev
```

## Authentication Methods

### 1. Google Sign-In
- One-click authentication using Google OAuth
- Automatic profile creation with Google account info

### 2. Email/Password Authentication
- Traditional email and password signup/login
- Email verification for new accounts

### 3. Email Verification (Profile Settings)
- OTP-based email verification for updating email addresses
- Secure email change process

## Authentication Flow

1. User chooses authentication method (Google or Email/Password)
2. Firebase handles authentication
3. Frontend receives Firebase ID token
4. Backend verifies token using Firebase Admin SDK
5. Backend creates/updates user in MongoDB with email as primary identifier
6. Role-based access and UI is provided

## Admin Access

- Email: admin@lapatisserie.com (automatically assigned admin role)
- Any user with the admin email gets admin privileges

## API Endpoints

- POST /api/auth/verify - Verify Firebase ID token
- GET /api/users/me - Get current user profile
- PUT /api/users/:id - Update user profile
- GET /api/users - Get all users (admin only)
- GET /api/users/:id - Get user by ID (admin only)
