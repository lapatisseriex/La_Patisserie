# Free Product System - Quick Testing Guide

## 🧪 How to Test the System

### Prerequisites
- Backend server running on port 3000
- Frontend running on port 5173
- MongoDB connected
- User account created and logged in

---

## Test Scenario 1: Track Order Days (Manual Testing)

### Option A: Simulate Multiple Days in Database
Since you need 10 different days, you can manually add test data:

```javascript
// In MongoDB Compass or mongo shell
db.users.updateOne(
  { email: "your-test-email@example.com" },
  {
    $set: {
      monthlyOrderDays: [
        { date: new Date("2025-11-01"), month: 11, year: 2025 },
        { date: new Date("2025-11-02"), month: 11, year: 2025 },
        { date: new Date("2025-11-03"), month: 11, year: 2025 },
        { date: new Date("2025-11-04"), month: 11, year: 2025 },
        { date: new Date("2025-11-05"), month: 11, year: 2025 },
        { date: new Date("2025-11-06"), month: 11, year: 2025 },
        { date: new Date("2025-11-07"), month: 11, year: 2025 },
        { date: new Date("2025-11-08"), month: 11, year: 2025 },
        { date: new Date("2025-11-09"), month: 11, year: 2025 },
        { date: new Date("2025-11-10"), month: 11, year: 2025 }
      ],
      freeProductEligible: true,
      lastRewardMonth: "2025-11"
    }
  }
)
```

### Option B: Modify Middleware for Testing
Temporarily change the requirement from 10 to 1 day:

```javascript
// In backend/middleware/freeProductMiddleware.js
// Line ~68: Change from
if (uniqueDaysCount >= 10 && !user.freeProductEligible) {
// To
if (uniqueDaysCount >= 1 && !user.freeProductEligible) {
```

**Remember to change it back to 10 after testing!**

---

## Test Scenario 2: Check Progress Display

1. **Place an order** (any product, any payment method)
2. **Navigate to Cart page** (`/cart`)
3. **Expected Result**: Should see progress banner
   - "Order on X more days to unlock"
   - Progress bar showing X/10 days

### API Test:
```bash
# Get progress
curl -X GET http://localhost:3000/api/free-product/progress \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Test Scenario 3: Eligibility Banner

1. **Set user as eligible** (use Option A above or place 10 orders)
2. **Navigate to Cart page**
3. **Expected Result**: Should see eligibility banner
   - "🎉 Congratulations! You've Unlocked a Free Product!"
   - "Select Your Free Product" button

### API Test:
```bash
# Check eligibility
curl -X GET http://localhost:3000/api/free-product/check-eligibility \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "uniqueDaysCount": 10,
    "daysRemaining": 0
  }
}
```

---

## Test Scenario 4: Free Product Selection

1. **Click "Select Your Free Product"** button
2. **Modal should open** with congratulations message
3. **Click "Select Free Product"** button in modal
4. **Redirected to Products page** with banner: "🎁 Select Your Free Product!"
5. **Browse products** - buttons should show "🎁 Select FREE" (in green)
6. **Click "🎁 Select FREE"** on any product
7. **Should see toast**: "🎁 Free product added to cart!"
8. **Auto-redirect to cart** after 1 second

### API Test:
```bash
# Add free product to cart
curl -X POST http://localhost:3000/api/free-product/add-to-cart \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "PRODUCT_ID_HERE", "variantIndex": 0}'
```

---

## Test Scenario 5: Cart Display with Free Product

1. **Check cart page** after adding free product
2. **Expected Results**:
   - Product shows **green "FREE" badge** (both mobile & desktop)
   - Cart total **excludes** the free product price
   - Can still add other regular products

### Example:
- Regular Product: ₹500
- Free Product: ~~₹300~~ FREE
- **Cart Total: ₹500** (not ₹800)

---

## Test Scenario 6: Complete Order with Free Product

1. **Proceed to checkout** with free product in cart
2. **Select delivery location**
3. **Complete order** (COD or online payment)
4. **Expected Results**:
   - Order placed successfully
   - Free product shown in order with price ₹0
   - User's `freeProductEligible` → false
   - User's `freeProductUsed` → true
   - Order day tracked in `monthlyOrderDays`

### Database Verification:
```javascript
// Check user document
db.users.findOne({ email: "your-email@example.com" })
// Should show:
// - freeProductEligible: false
// - freeProductUsed: true
```

```javascript
// Check order document
db.orders.findOne({ orderNumber: "YOUR_ORDER_NUMBER" })
// Should show cart item with:
// - isFreeProduct: true
// - price: 0
```

---

## Test Scenario 7: Remove Free Product from Cart

1. **Click remove button** on free product in cart
2. **Product removed** from cart
3. **User remains eligible** (can select different product)

### API Test:
```bash
# Remove free product
curl -X DELETE http://localhost:3000/api/free-product/remove-from-cart \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Test Scenario 8: Edge Cases

### A. Already Has Free Product
1. Add free product to cart
2. Try to add another free product
3. **Expected**: Error message "Cart already contains a free product"

### B. Product Out of Stock
1. Select out-of-stock product as free item
2. **Expected**: Handled gracefully (same as regular add to cart)

### C. Not Logged In
1. Try to access free product endpoints without auth
2. **Expected**: 401 Unauthorized

### D. Monthly Reset
1. Change system date to next month
2. Place an order
3. **Expected**: 
   - Old order days cleared
   - Unused eligibility reset
   - Fresh tracking starts

---

## Quick Debug Commands

### Check User Status:
```javascript
// MongoDB
db.users.findOne(
  { email: "test@example.com" },
  { monthlyOrderDays: 1, freeProductEligible: 1, freeProductUsed: 1 }
)
```

### Check Cart:
```javascript
// MongoDB
db.newcarts.findOne(
  { userId: "USER_ID" },
  { items: 1 }
)
```

### Check Recent Orders:
```javascript
// MongoDB
db.orders.find(
  { userId: "USER_ID" }
).sort({ createdAt: -1 }).limit(5)
```

### Backend Logs to Watch:
```bash
# Terminal running backend
# Look for:
- "📅 Order day tracked"
- "User ${userId} is now eligible for a free product!"
- "🎁 Free product reward used"
```

---

## Common Issues & Solutions

### Issue: Banner not showing
**Check:**
1. User logged in? ✓
2. API call successful? (Check Network tab)
3. Console errors? (Check browser console)

### Issue: Progress not updating
**Check:**
1. Order completed successfully? ✓
2. `trackOrderDay()` called? (Check server logs)
3. Database updated? (Check MongoDB)

### Issue: Can't add free product
**Check:**
1. User eligible? (Check API response)
2. Already has free product in cart? ✓
3. Product still active/available? ✓

### Issue: Cart total wrong
**Check:**
1. `isFreeProduct` flag set? (Check cart item)
2. Virtual `cartTotal` updated? (Check model)
3. Frontend calculation correct? (Check Cart.jsx)

---

## Testing Checklist

- [ ] Progress tracking (1-9 days)
- [ ] Eligibility banner appears
- [ ] Modal opens and closes
- [ ] Navigation to products works
- [ ] Free product selection works
- [ ] FREE badge displays in cart
- [ ] Cart total excludes free product
- [ ] Order completes successfully
- [ ] Free product shows ₹0 in order
- [ ] Eligibility resets after use
- [ ] Monthly reset works
- [ ] Mobile responsive
- [ ] No console errors

---

## Quick Reset for Retesting

```javascript
// Reset user for fresh test
db.users.updateOne(
  { email: "test@example.com" },
  {
    $set: {
      monthlyOrderDays: [],
      freeProductEligible: false,
      selectedFreeProductId: null,
      freeProductUsed: false,
      lastRewardMonth: null
    }
  }
)
```

---

**Happy Testing! 🎉**

If you encounter any issues, check:
1. Browser console (F12)
2. Server logs (terminal)
3. Network tab (API calls)
4. MongoDB documents (data)
