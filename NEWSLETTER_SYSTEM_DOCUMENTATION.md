# Newsletter System Documentation - La Pâtisserie

## Overview
A complete newsletter subscription and management system that allows customers to subscribe to updates and automatically sends emails when new products, categories, or discounts are added.

---

## Features Implemented

### ✅ Customer-Facing Features
1. **Newsletter Subscription Form** (Footer)
   - Email validation
   - Duplicate prevention
   - Success/error messaging
   - Responsive design matching website theme

2. **Automatic Email Notifications**
   - New product announcements
   - New category announcements
   - Discount/special offer alerts
   - Welcome email on subscription

3. **Email Templates**
   - Beautiful HTML emails matching website color scheme (purple #A855F7, dark themes)
   - Responsive design
   - Brand-consistent styling
   - Unsubscribe link in every email

### ✅ Admin Features
1. **Subscriber Management**
   - View all subscribers with pagination
   - Search by email
   - Filter by status (active/unsubscribed)
   - Add subscribers manually
   - Edit subscriber details
   - Delete subscribers
   - View subscription statistics

2. **Manual Newsletter Sending**
   - Custom subject and title
   - HTML body support
   - Optional CTA button with link
   - Preview of recipient count
   - Batch sending to avoid rate limits

3. **Analytics Dashboard**
   - Total subscribers
   - Active subscribers count
   - Unsubscribed count
   - Recent subscribers (last 30 days)
   - Subscribers by source

---

## File Structure

### Backend Files

#### Models
- `backend/models/newsletterModel.js`
  - Newsletter schema with email validation
  - Status tracking (active/unsubscribed)
  - Source tracking (footer, admin, checkout)
  - Timestamps for subscription and last email sent

#### Controllers
- `backend/controllers/newsletterController.js`
  - `subscribe` - Public subscription endpoint
  - `unsubscribe` - Public unsubscribe endpoint
  - `getAllSubscribers` - Admin: get all subscribers
  - `addSubscriberManually` - Admin: add new subscriber
  - `updateSubscriber` - Admin: edit subscriber
  - `deleteSubscriber` - Admin: delete subscriber
  - `getNewsletterStats` - Admin: get statistics

#### Routes
- `backend/routes/newsletterRoutes.js`
  - Public routes: `/subscribe`, `/unsubscribe`
  - Admin routes: `/admin/subscribers`, `/admin/add`, `/admin/:id`, `/admin/send`, `/admin/stats`

#### Email Services
- `backend/utils/newsletterEmailService.js`
  - `sendNewProductNewsletter` - Auto-triggered on product creation
  - `sendNewCategoryNewsletter` - Auto-triggered on category creation
  - `sendDiscountNewsletter` - Auto-triggered on discount updates
  - `sendCustomNewsletter` - Manual newsletter sending
  - `sendWelcomeEmail` - Welcome email for new subscribers
  - Batch sending with rate limiting

- `backend/utils/newsletterEmailTemplates.js`
  - `newProductTemplate` - Beautiful product announcement email
  - `newCategoryTemplate` - Category collection email
  - `discountTemplate` - Special offer/discount email
  - `customNewsletterTemplate` - Manual newsletter template
  - Consistent header and footer across all emails

#### Auto-Triggers (Modified Files)
- `backend/controllers/productController.js`
  - Triggers newsletter on new product creation
  - Triggers newsletter on discount application

- `backend/controllers/categoryController.js`
  - Triggers newsletter on new category creation

- `backend/server.js`
  - Registered newsletter routes: `app.use('/api/newsletter', newsletterRoutes)`

### Frontend Files

#### Components
- `LapatisseriexFrontned/src/components/Footer/Footer.jsx`
  - Newsletter subscription form
  - Email validation
  - Loading states
  - Success/error messages

- `LapatisseriexFrontned/src/components/Admin/AdminNewsletter.jsx`
  - Complete admin dashboard for newsletter management
  - Subscriber list with search and filters
  - Add/Edit/Delete subscribers
  - Manual newsletter composer
  - Statistics cards
  - Responsive tables and mobile cards

#### Routes (Modified Files)
- `LapatisseriexFrontned/src/App.jsx`
  - Added import for `AdminNewsletter`
  - Added route: `/admin/newsletter`

- `LapatisseriexFrontned/src/components/Admin/AdminDashboardLayout.jsx`
  - Added "Newsletter" menu item in admin sidebar

---

## API Endpoints

### Public Endpoints

#### Subscribe to Newsletter
```http
POST /api/newsletter/subscribe
Content-Type: application/json

{
  "email": "customer@example.com",
  "source": "footer" // optional: footer, checkout, admin, other
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for subscribing! You will receive updates about our delicious desserts.",
  "data": {
    "_id": "...",
    "email": "customer@example.com",
    "status": "active",
    "source": "footer",
    "subscribedAt": "2025-10-13T..."
  }
}
```

#### Unsubscribe from Newsletter
```http
POST /api/newsletter/unsubscribe
Content-Type: application/json

{
  "email": "customer@example.com"
}
```

### Admin Endpoints (Requires Authentication)

#### Get All Subscribers
```http
GET /api/newsletter/admin/subscribers?page=1&limit=10&status=active
Authorization: Bearer <firebase_token>
```

#### Get Statistics
```http
GET /api/newsletter/admin/stats
Authorization: Bearer <firebase_token>
```

#### Add Subscriber
```http
POST /api/newsletter/admin/add
Authorization: Bearer <firebase_token>
Content-Type: application/json

{
  "email": "newsubscriber@example.com"
}
```

#### Update Subscriber
```http
PUT /api/newsletter/admin/:id
Authorization: Bearer <firebase_token>
Content-Type: application/json

{
  "email": "updated@example.com",
  "status": "active" // or "unsubscribed"
}
```

#### Delete Subscriber
```http
DELETE /api/newsletter/admin/:id
Authorization: Bearer <firebase_token>
```

#### Send Custom Newsletter
```http
POST /api/newsletter/admin/send
Authorization: Bearer <firebase_token>
Content-Type: application/json

{
  "subject": "Newsletter Subject",
  "title": "OPTIONAL TITLE",
  "body": "<p>HTML content here...</p>",
  "ctaText": "SHOP NOW",
  "ctaLink": "https://lapatisserie.com/products"
}
```

---

## Environment Variables Required

Add these to your backend `.env` file:

```env
# Email Configuration (Gmail)
EMAIL_USER=lapatisserielapatisserie@gmail.com
EMAIL_PASSWORD=your_app_password_here

# Frontend URL (for unsubscribe links)
FRONTEND_URL=http://localhost:5173  # or your production URL
```

### Setting Up Gmail App Password
1. Go to Google Account settings
2. Security → 2-Step Verification
3. App passwords
4. Generate a new app password for "Mail"
5. Use this password in `EMAIL_PASSWORD`

---

## Email Template Design

All emails follow La Pâtisserie's brand guidelines:
- **Primary Color**: Purple (#A855F7)
- **Secondary Color**: Dark pink (#733857)
- **Background**: Dark gradient (#040404, #281c20, #412434)
- **Font**: System UI, -apple-system, sans-serif
- **Style**: Elegant, minimalist, luxury

### Email Types

1. **New Product Email**
   - Product image
   - Product name and description
   - Price display
   - Category information
   - "ORDER NOW" CTA button

2. **New Category Email**
   - Category name and description
   - Elegant collection announcement
   - "EXPLORE COLLECTION" CTA button

3. **Discount Email**
   - Discount percentage badge
   - Product image
   - Original vs discounted price
   - Savings amount
   - Validity period (if applicable)
   - "CLAIM DISCOUNT NOW" CTA button

4. **Custom Newsletter**
   - Flexible HTML body
   - Optional title banner
   - Optional CTA button
   - Consistent branding

---

## Auto-Trigger Logic

### New Product
- Triggers: When a new product is created via admin
- Email sent: After product is successfully saved to database
- Async: Non-blocking (doesn't delay response)

### New Category
- Triggers: When a new category is created via admin
- Email sent: After category is successfully saved to database
- Async: Non-blocking

### Discount Applied
- Triggers: When a discount is newly applied to a product
- Conditions:
  - Product didn't have a discount before, OR
  - Product's `cancelOffer` was true and now being set to false
  - Discount type and value are set
  - Product is active
- Email sent: After discount is successfully saved
- Async: Non-blocking

---

## Database Schema

### Newsletter Collection

```javascript
{
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validated: true  // Email regex validation
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed'],
    default: 'active'
  },
  source: {
    type: String,
    enum: ['footer', 'admin', 'checkout', 'other'],
    default: 'footer'
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date,
    default: null
  },
  lastEmailSent: {
    type: Date,
    default: null
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `email`: Unique index
- `status`: Index for filtering

---

## Usage Guide

### For Customers

1. **Subscribe**:
   - Scroll to website footer
   - Enter email in "Sign up for updates" section
   - Click "Sign Up"
   - Receive welcome email

2. **Unsubscribe**:
   - Click "Unsubscribe" link at bottom of any newsletter email
   - Confirm unsubscription

### For Admins

1. **Access Newsletter Management**:
   - Login to admin panel
   - Navigate to Admin → Newsletter

2. **View Subscribers**:
   - See all subscribers in table format
   - Use search to find specific emails
   - Filter by status (active/unsubscribed)
   - View statistics at top

3. **Add Subscriber**:
   - Click "Add Subscriber" button
   - Enter email address
   - Submit

4. **Edit Subscriber**:
   - Click edit icon on subscriber row
   - Modify email or status
   - Save changes

5. **Delete Subscriber**:
   - Click delete icon on subscriber row
   - Confirm deletion

6. **Send Manual Newsletter**:
   - Click "Send Newsletter" button
   - Fill in:
     - Subject (required)
     - Title (optional)
     - Body HTML (required)
     - CTA text and link (optional)
   - Review subscriber count
   - Click "Send Newsletter"
   - Wait for confirmation

---

## Testing

### Test Subscription Flow
1. Open website footer
2. Enter test email
3. Verify success message
4. Check database for new subscriber
5. Check email inbox for welcome email

### Test Admin Features
1. Login as admin
2. Navigate to /admin/newsletter
3. Test each CRUD operation
4. Send test newsletter

### Test Auto-Triggers
1. Create new product → Check subscriber emails
2. Create new category → Check subscriber emails
3. Apply discount to product → Check subscriber emails

---

## Troubleshooting

### Emails Not Sending
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Verify Gmail app password is correct
- Check console for error messages
- Verify subscribers have status 'active'

### Duplicate Subscription Error
- Expected behavior for existing emails
- System prevents duplicate subscriptions
- Offers to resubscribe if previously unsubscribed

### Newsletter Not Triggering
- Check if product/category was successfully created
- Check console logs for newsletter service errors
- Verify email service is configured
- Check that subscribers exist in database

---

## Future Enhancements (Optional)

- [ ] Email open tracking
- [ ] Click tracking for links
- [ ] Subscriber preferences (product types, frequency)
- [ ] A/B testing for email templates
- [ ] Scheduled newsletters
- [ ] Email preview before sending
- [ ] Subscriber segments
- [ ] Import/export subscribers (CSV)
- [ ] Email templates library
- [ ] Newsletter analytics dashboard

---

## Security Considerations

✅ **Implemented**:
- Email validation
- Duplicate prevention
- Admin authentication required
- Rate limiting on email sending
- Unsubscribe links in all emails
- XSS prevention in email templates

⚠️ **Recommended**:
- Implement CAPTCHA on footer subscription form
- Add email verification (double opt-in)
- Monitor for spam subscriptions
- Implement daily email sending limits

---

## Performance

- **Batch Sending**: Emails sent in batches of 10
- **Rate Limiting**: 1-second delay between batches
- **Async Processing**: Newsletter sending doesn't block API responses
- **Caching**: Subscriber counts cached for statistics
- **Pagination**: Admin view loads 10 subscribers per page

---

## Support

For issues or questions:
1. Check console logs for errors
2. Verify environment variables
3. Test email configuration
4. Review this documentation
5. Contact development team

---

**Created**: October 13, 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete and Production Ready
