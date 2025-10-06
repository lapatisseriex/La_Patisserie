# Email Notification Setup Guide

## Overview
This system sends automated email notifications to users when:
1. **Order Confirmation** - When a new order is placed
2. **Status Updates** - When admin updates order status (confirmed, preparing, ready, out_for_delivery, delivered)

## Email Templates
Beautiful, responsive HTML email templates with:
- Order progress visualization
- Professional branding
- Mobile-friendly design
- Order details and tracking links

## Setup Instructions

### 1. Environment Variables
Add these variables to your `.env` file:

```env
# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
FRONTEND_URL=http://localhost:5173
```

### 2. Gmail App Password Setup
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable 2-Step Verification
3. Go to "App Passwords" section
4. Generate a new app password for "Mail"
5. Use this app password (not your regular password) for EMAIL_PASS

### 3. Alternative Email Providers
You can use other SMTP providers by modifying `utils/orderEmailService.js`:

```javascript
// For Outlook/Hotmail
service: 'hotmail'

// For Yahoo
service: 'yahoo'

// For custom SMTP
host: 'smtp.yourprovider.com',
port: 587,
secure: false,
```

## Testing

### Manual Testing
1. Update the test email in `test-email.js`
2. Uncomment the last line
3. Run: `node test-email.js`

### Production Testing
1. Create a test order through the frontend
2. Update order status through admin panel
3. Check user's email for notifications

## Email Templates

### Order Confirmation
- Sent when order is first created
- Contains order summary and tracking link
- Professional welcome message

### Status Updates
- **Confirmed** 🎉 - Order confirmed
- **Preparing** 👨‍🍳 - Being prepared by bakers
- **Ready** 📦 - Ready for pickup/delivery
- **Out for Delivery** 🚛 - On the way
- **Delivered** ✨ - Successfully delivered

## Features

### Professional Design
- Responsive layout for mobile/desktop
- Brand colors and styling
- Progress bar visualization
- Product images and details

### Smart Notifications
- Only sends when status actually changes
- Includes order tracking link
- Fallback gracefully if email fails
- Rate limiting and connection pooling

### Error Handling
- Email failures don't break order processing
- Detailed logging for debugging
- Graceful fallbacks

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Verify Gmail app password
   - Check 2-step verification is enabled
   - Ensure EMAIL_USER and EMAIL_PASS are correct

2. **Emails Not Sending**
   - Check server logs for error messages
   - Verify internet connectivity
   - Test with test-email.js script

3. **HTML Not Rendering**
   - Check email client compatibility
   - Test with different email providers
   - Verify HTML template syntax

### Debug Mode
Enable detailed logging by adding to your .env:
```env
NODE_ENV=development
```

## Security Notes

1. **Never commit credentials** to version control
2. **Use app passwords** instead of regular passwords
3. **Rotate credentials** regularly
4. **Monitor email usage** for abuse

## Customization

### Email Templates
Modify `utils/orderEmailTemplates.js` to:
- Change colors and branding
- Add/remove content sections
- Update messaging and copy

### Email Service
Modify `utils/orderEmailService.js` to:
- Change SMTP provider
- Add additional email types
- Modify sending logic

## Production Deployment

### Environment Setup
```env
EMAIL_USER=production-email@yourdomain.com
EMAIL_PASS=secure-app-password
FRONTEND_URL=https://yourwebsite.com
```

### Monitoring
- Set up email delivery monitoring
- Track bounce rates and failures
- Monitor sending quotas and limits

## Support
For issues with email notifications:
1. Check server logs first
2. Run test-email.js for debugging
3. Verify environment configuration
4. Test with different email providers