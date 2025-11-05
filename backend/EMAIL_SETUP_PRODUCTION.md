# Email Setup for Production - Order Status Updates

## ✅ Current Status

**Order Status Update** emails are configured to send when order status changes (preparing, ready, out_for_delivery, delivered).

## 📧 Email Flow

### When an order status is updated:

1. **Customer Email** (Status Update Notification)
   - Sent to: Customer's registered email
   - Contains: Order number, new status, tracking link, order details
   - Template: Rich HTML with status-specific messaging

**Note:** Order confirmation emails and admin new order alert emails have been disabled. Orders are placed without sending these emails.

## 🔧 Required Environment Variables

Make sure these are set in your production `.env` file:

```env
# Email Configuration (Gmail)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL for tracking links
FRONTEND_URL=https://www.lapatisserie.shop
```

### How to get EMAIL_PASS (Gmail App Password):
1. Go to Google Account Settings
2. Security → 2-Step Verification (enable if not enabled)
3. App Passwords → Generate new app password
4. Select "Mail" and "Other (Custom name)"
5. Copy the 16-character password
6. Use this in EMAIL_PASS (no spaces)

## 🚀 Implementation Details

### Failure-Resistant Design:
- ✅ Emails send asynchronously (don't block order placement)
- ✅ Order placement succeeds even if emails fail
- ✅ Multiple fallbacks for fetching user data
- ✅ PDF generation is optional (continues without PDF if it fails)
- ✅ Detailed logging at every step
- ✅ Each email wrapped in try-catch blocks
- ✅ Admin email fetching wrapped in try-catch

### Logging:
- `📧` Email sending initiated
- `✅` Success messages with message IDs
- `❌` Error messages with full details
- `⚠️` Warnings for fallback scenarios
- `[COD]` or `[ONLINE]` prefixes to identify payment type

##  Monitoring Email Delivery

### Check logs for:
```
📧 Sending order status email
✅ Order status email sent successfully: <message-id>
```

### If emails aren't sending, check:
1. ❌ No logs appear → Email function not being called
2. ⚠️ "User email not found" → User email missing in database
3. ❌ "Error sending" → Check EMAIL_USER and EMAIL_PASS
4. ❌ "Transporter creation failed" → Invalid Gmail credentials

## 🎯 Testing in Production

### Test status update email:
1. Place a test order
2. Update order status (e.g., to "preparing")
3. Check customer inbox (including spam folder)
4. Verify email contains correct status information
5. Check tracking link works

### Check server logs:
```bash
# Look for these patterns
grep "Order status email sent" logs/
```

## 🛡️ Error Handling

Email operations for status updates are wrapped in error handling:
- Email sending errors → Logged but doesn't affect order status update
- Logo/image attachment errors → Continues without attachments

**Result:** Order status updates will NEVER fail due to email issues.

## 📊 Email Statistics

### Timing:
- Emails are sent when order status is manually updated
- Non-blocking async operation
- Typical send time: 1-3 seconds
- Status update response returns immediately (doesn't wait for emails)

## 🔐 Security Notes

- Gmail App Password required (not regular password)
- Use environment variables (never commit credentials)
- Email credentials encrypted in transit
- Validates email addresses before sending

## ⚠️ Important Changes

**Order confirmation and admin alert emails have been removed:**
- No email is sent when a new order is placed
- No email is sent to admins when orders are received
- Only status update emails (preparing, ready, out_for_delivery, delivered) are sent to customers
- This simplifies the email flow and reduces email volume

## 📞 Support

If emails still don't work after configuration:
1. Check Gmail "Less secure app access" is OFF (should use App Password)
2. Verify 2FA is enabled on Gmail account
3. Check production server can reach smtp.gmail.com:587
4. Review server logs for specific error messages
5. Test with a simple nodemailer test script first

---

**Last Updated:** November 3, 2025
**Status:** ✅ Production Ready
