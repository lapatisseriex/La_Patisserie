# Public Assets Documentation

## Overview
The backend now includes a `public` directory that serves static assets, including the logo, which can be accessed in both development and production environments.

## Directory Structure
```
backend/
├── public/
│   └── images/
│       └── logo.png
├── utils/
│   └── logoUtils.js
└── routes/
    └── publicRoutes.js
```

## Static File Access

### Direct File Access
- **Logo**: `http://your-backend-url/public/images/logo.png`
- **Any public file**: `http://your-backend-url/public/path/to/file`

### API Endpoints

#### Get Logo
```
GET /api/public/logo
Content-Type: image/png
```
Returns the logo image with proper caching headers.

#### Get Logo as Base64
```
GET /api/public/logo/base64
Content-Type: application/json

Response:
{
  "success": true,
  "data": "iVBORw0KGgoAAAANSUhEUgAA...", // base64 string
  "mimeType": "image/png",
  "filename": "logo.png"
}
```

## Email Integration

### Automatic Logo Attachment
The email service can include the logo from the public directory when sending status update emails:

```javascript
import { getLogoData } from '../utils/logoUtils.js';

// Get logo data for email attachment
const logoData = getLogoData();

// Send email with logo attachment
await sendOrderStatusNotification(orderDetails, newStatus, userEmail, logoData);
```

### Utility Functions

#### `getLogoData()`
Returns the logo as a Buffer for email attachments.

#### `getLogoBase64()`
Returns the logo as a base64 string.

#### `getLogoUrl()`
Returns the public URL for the logo.

## Production Deployment

### Environment Variables
Set `BACKEND_URL` or `API_URL` environment variable for correct logo URLs:
```bash
BACKEND_URL=https://your-production-backend.com
```

### File Deployment
Ensure the `public` directory is included in your production build:
- **Heroku**: Files are automatically included
- **Vercel**: Add `public` to your build
- **Docker**: Copy public directory in Dockerfile
- **VPS**: Upload public directory to server

### Nginx Configuration (if using)
```nginx
location /public/ {
    root /path/to/your/backend;
    expires 1d;
    add_header Cache-Control "public, immutable";
}
```

## Benefits

1. **Deployment Independent**: Logo works even when frontend and backend are deployed separately
2. **Email Attachments**: Logo is embedded in emails for offline viewing
3. **Caching**: Static files are served with proper cache headers
4. **Fallback Support**: Email service falls back to public directory if no logo data provided
5. **Production Ready**: Works in all deployment environments

## Usage Examples

### Frontend (React/Vue/etc)
```javascript
// Use logo from backend
const logoUrl = `${process.env.REACT_APP_API_URL}/api/public/logo`;

// Or get as base64 for processing
const response = await fetch(`${process.env.REACT_APP_API_URL}/api/public/logo/base64`);
const { data: logoBase64 } = await response.json();
```

### Email Templates
The logo is automatically embedded in emails with the CID `logo@lapatisserie`:
```html
<img src="cid:logo@lapatisserie" alt="La Patisserie Logo" />
```