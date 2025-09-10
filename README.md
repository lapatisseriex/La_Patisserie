# La Patisserie X - Authentication System

This repository contains both the frontend and backend code for the La Patisserie X authentication system using Firebase Phone Authentication, Firebase Admin SDK, and MongoDB with role-based access okay

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
- OTP-based login with Firebase
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

## Authentication Flow

1. User enters phone number
2. Firebase sends OTP to phone
3. User verifies OTP
4. Firebase returns ID token
5. Frontend sends token to backend
6. Backend verifies token using Firebase Admin SDK
7. Backend creates/fetches user from MongoDB
8. Role-based access and UI is provided

## Admin Access

- Phone: +91 9500643892 (automatically assigned admin role)
- Default user: +91 9361620860 (or any other number)

## API Endpoints

- POST /api/auth/verify - Verify Firebase ID token
- GET /api/users/me - Get current user profile
- PUT /api/users/:id - Update user profile
- GET /api/users - Get all users (admin only)
- GET /api/users/:id - Get user by ID (admin only)
