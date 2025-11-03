# Production Email Checklist ✅

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

### 3. Admin Users
- [ ] At least one admin user exists in database
- [ ] Admin user has `role: 'admin'`
- [ ] Admin user has `isActive: true`
- [ ] Admin user has valid email address
- [ ] Query: `db.users.find({ role: 'admin', isActive: true })`

### 4. Code Deployment
- [ ] Latest code is deployed to production
- [ ] `orderEmailService.js` has simplified transporter
- [ ] `paymentController.js` has robust error handling
- [ ] No syntax errors in email functions
- [ ] Server restarted after deployment

## Post-Deployment Testing

### Test 1: COD Order
- [ ] Place a COD order
- [ ] Check customer receives confirmation email
- [ ] Check admin receives alert email
- [ ] Verify invoice PDF is attached to both
- [ ] Check tracking link works in customer email
- [ ] Check logs show success messages

### Test 2: Online Payment Order
- [ ] Place an online payment order (Razorpay)
- [ ] Check customer receives confirmation email
- [ ] Check admin receives alert email
- [ ] Verify invoice PDF is attached to both
- [ ] Check tracking link works in customer email
- [ ] Check logs show success messages

### Test 3: Error Scenarios
- [ ] Order still succeeds if email fails
- [ ] Order succeeds if PDF generation fails
- [ ] Order succeeds if admin email fetch fails
- [ ] Proper error messages in logs

## Monitoring (First Week)

### Daily Checks
- [ ] Check server logs for email errors
- [ ] Verify customers are receiving emails
- [ ] Verify admins are receiving alerts
- [ ] Check spam folders initially
- [ ] Monitor email delivery rate

### Log Patterns to Monitor
```bash
# Success patterns
✅ Order confirmation email sent successfully
✅ Admin new-order email sent
✅ Invoice PDF generated

# Warning patterns (acceptable)
⚠️ Failed to generate invoice PDF (continuing without it)

# Error patterns (needs attention)
❌ Error sending order confirmation email
❌ Failed to create email transporter
❌ Error fetching admin emails
```

## Troubleshooting Guide

### Customer not receiving emails
1. Check spam folder
2. Verify user email exists in database
3. Check logs for "Order confirmation email sent successfully"
4. Test with different email provider (Gmail, Outlook, etc.)
5. Verify EMAIL_USER and EMAIL_PASS are correct

### Admin not receiving emails
1. Check admin email in spam folder
2. Verify admins exist: `db.users.find({ role: 'admin', isActive: true })`
3. Check logs for "Admin new-order email sent"
4. Verify admin emails are valid
5. Add test admin and retest

### Emails going to spam
1. Add sender to contacts
2. Mark email as "Not Spam"
3. Consider using verified domain email (not @gmail.com)
4. Add SPF/DKIM records if using custom domain

### PDF not attaching
1. Check logs for "Invoice PDF generated"
2. Verify order data is complete
3. Check server has write permissions
4. Email will still send without PDF (by design)

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
   // In paymentController.js, comment out email IIFE
   // (async () => { ... })().catch(...)
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
- Customer receives email within 10 seconds of order
- Admin receives email within 10 seconds of order
- Both emails have PDF attachments
- Tracking link redirects correctly
- No email errors in server logs
- Order placement is fast (< 2 seconds)

## Support Contacts

- Gmail App Password Setup: https://support.google.com/accounts/answer/185833
- Nodemailer Docs: https://nodemailer.com/
- SMTP Troubleshooting: Check server firewall for port 587

---

**Status:** Ready for Production ✅
**Last Updated:** November 3, 2025
