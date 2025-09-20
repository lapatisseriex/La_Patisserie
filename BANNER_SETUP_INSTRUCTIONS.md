# Banner Management Setup Instructions

## Cloudinary Configuration

To enable file uploads in the Banner Management system, you need to configure Cloudinary:

### 1. Create Cloudinary Account
- Go to https://cloudinary.com and create a free account
- Note down your Cloud Name from the dashboard

### 2. Update Banner Form
Open `src/components/Admin/BannerForm.jsx` and replace:
```javascript
`https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/${resourceType}/upload`
```
with:
```javascript
`https://api.cloudinary.com/v1_1/YOUR_ACTUAL_CLOUD_NAME/${resourceType}/upload`
```

### 3. Create Upload Preset
1. Go to Cloudinary Dashboard → Settings → Upload
2. Add Upload Preset with name: `la_patisserie_banners`
3. Set Signing Mode to "Unsigned"
4. Configure allowed formats: jpg, png, gif, mp4, mov
5. Set max file size to 50MB

## Features Included

### Admin Panel Access
- Navigate to `/admin/banners` (requires admin login)
- Accessible from admin sidebar menu

### Banner Management Features
✅ **CRUD Operations**
- Create new banners with form
- Edit existing banners
- Delete banners with confirmation
- Toggle active/inactive status

✅ **File Upload Support**
- Images (PNG, JPG, GIF)
- Videos (MP4, MOV)
- Drag & drop interface
- Upload progress indicator
- File type validation

✅ **Drag & Drop Reordering**
- Click and drag banners to reorder
- Visual feedback during dragging
- Auto-save new order

✅ **Live Preview**
- Desktop and mobile preview modes
- Real-time preview during form editing
- Overlay content preview with fonts and styling

✅ **Professional UI**
- Stats dashboard showing video/image counts
- Thumbnail previews in banner list
- Status indicators (Active/Inactive, Video/Image)
- Responsive design

### Form Fields
- **Title**: Main banner headline
- **Subtitle**: Secondary text
- **Description**: Additional content description
- **Features**: Up to 3 bullet points
- **Media Upload**: Video or image file
- **Active Status**: Toggle visibility

### Integration
The banner data will integrate with your existing `AdvertisementBanner.jsx` component. To make it dynamic:

1. Create API endpoints in your backend:
   - `GET /api/admin/banners` - Fetch all banners
   - `POST /api/admin/banners` - Create new banner
   - `PUT /api/admin/banners/:id` - Update banner
   - `DELETE /api/admin/banners/:id` - Delete banner
   - `PUT /api/admin/banners/reorder` - Update banner order

2. Update `AdvertisementBanner.jsx` to fetch data from API instead of using hardcoded banners

## Next Steps
1. Set up Cloudinary account and update cloud name
2. Implement backend API endpoints
3. Test the complete banner management workflow
4. Update frontend banner component to use dynamic data

The admin panel is now ready for banner management with all requested features!