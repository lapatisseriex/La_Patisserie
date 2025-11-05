# Production Email Checklist ✅

## ⚠️ Important Note

**Order confirmation and admin alert emails have been disabled.**
- No emails are sent when new orders are placed
- Only order status update emails are sent (preparing, ready, out_for_delivery, delivered)

## Pre-Deployment Checklist

### 1. Environment Variables
- [ ] `EMAIL_USER` is set (Gmail address)
- [ ] `EMAIL_PASS` is set (Gmail App Password, not regular password)
- [ ] `FRONTEND_URL` is set (https://www.lapatisserie.shop)
- [ ] Restart server after setting env variables

### 2. Gmail Account Setup
- [ ] 2-Step Verification is enabled
- [ ] App Password is generated (16 characters)
- [ ] "Less secure app access" is OFF
- [ ] Test sending from this account manually

### 3. Code Deployment
- [ ] Latest code is deployed to production
- [ ] `orderEmailService.js` has order status email functions only
- [ ] `paymentController.js` does not send order confirmation emails
- [ ] No syntax errors in email functions
- [ ] Server restarted after deployment

## Post-Deployment Testing

### Test 1: Order Placement
- [ ] Place a COD order
- [ ] Verify NO confirmation email is sent to customer
- [ ] Verify NO alert email is sent to admin
- [ ] Order is created successfully
- [ ] Check logs show no email errors

### Test 2: Order Status Update
- [ ] Update order status to "preparing"
- [ ] Check customer receives status update email
- [ ] Verify email contains correct status information
- [ ] Check tracking link works in email
- [ ] Check logs show success messages

### Test 3: Error Scenarios
- [ ] Order status update succeeds if email fails
- [ ] Proper error messages in logs

## Monitoring (First Week)

### Daily Checks
- [ ] Check server logs for email errors
- [ ] Verify customers are receiving status update emails
- [ ] Check spam folders initially
- [ ] Monitor email delivery rate

### Log Patterns to Monitor
```bash
# Success patterns
✅ Order status email sent successfully

# Error patterns (needs attention)
❌ Error sending order status email
❌ Failed to create email transporter
```

## Troubleshooting Guide

### Customer not receiving status update emails
1. Check spam folder
2. Verify user email exists in database
3. Check logs for "Order status email sent successfully"
4. Test with different email provider (Gmail, Outlook, etc.)
5. Verify EMAIL_USER and EMAIL_PASS are correct
6. Ensure order status is being updated correctly

### Emails going to spam
1. Add sender to contacts
2. Mark email as "Not Spam"
3. Consider using verified domain email (not @gmail.com)
4. Add SPF/DKIM records if using custom domain

### Server errors
1. Check EMAIL_USER environment variable is set
2. Check EMAIL_PASS environment variable is set
3. Restart server after changing env variables
4. Test network connectivity to smtp.gmail.com:587
5. Review full error stack trace in logs

## Emergency Rollback

If emails are causing critical issues:

1. **Disable email sending temporarily:**
   ```javascript
   // In orderController.js, comment out status email sending
   ```

2. **Check error logs:**
   ```bash
   tail -f logs/error.log | grep -i email
   ```

3. **Verify env variables:**
   ```bash
   echo $EMAIL_USER
   echo $EMAIL_PASS
   ```

4. **Test transporter separately:**
   Create a test script to isolate the issue

## Success Criteria

✅ **Emails are working when:**
- Customer receives status update email within 10 seconds of status change
- Email contains correct status information
- Tracking link redirects correctly
- No email errors in server logs
- Order status updates are fast (< 2 seconds)
- No emails are sent on order placement (this is expected behavior)

## Support Contacts

- Gmail App Password Setup: https://support.google.com/accounts/answer/185833
- Nodemailer Docs: https://nodemailer.com/
- SMTP Troubleshooting: Check server firewall for port 587

---

**Status:** Ready for Production ✅
**Last Updated:** November 3, 2025
