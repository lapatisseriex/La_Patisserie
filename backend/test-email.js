// Test script for order email notifications
// Run this with: node test-email.js

import { sendOrderStatusNotification, sendOrderConfirmationEmail } from './utils/orderEmailService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Mock order data for testing
const mockOrder = {
  orderNumber: 'ORD1698765432123',
  userId: {
    email: 'test@example.com', // Replace with your test email
    name: 'Test User'
  },
  cartItems: [
    {
      productName: 'Chocolate Cake',
      productImage: 'https://example.com/chocolate-cake.jpg',
      quantity: 1,
      price: 450
    },
    {
      productName: 'Vanilla Cupcake',
      productImage: 'https://example.com/vanilla-cupcake.jpg',
      quantity: 2,
      price: 120
    }
  ],
  orderSummary: {
    cartTotal: 690,
    discountedTotal: 690,
    deliveryCharge: 40,
    taxAmount: 73,
    couponDiscount: 0,
    grandTotal: 803
  },
  userDetails: {
    name: 'Test User',
    address: '123 Test Street, Test Area',
    city: 'Test City',
    phone: '+91 9876543210'
  }
};

// Test email notifications
const testEmailNotifications = async () => {
  console.log('🧪 Testing Email Notification System...\n');

  // Test 1: Order Confirmation Email
  console.log('📧 Test 1: Order Confirmation Email');
  try {
    const confirmationResult = await sendOrderConfirmationEmail(
      mockOrder, 
      'lapatisseriex@gmail.com' // Using your email for testing
    );
    
    if (confirmationResult.success) {
      console.log('✅ Order confirmation email sent successfully');
      console.log('   Message ID:', confirmationResult.messageId);
    } else {
      console.log('❌ Order confirmation email failed');
      console.log('   Error:', confirmationResult.error);
    }
  } catch (error) {
    console.log('❌ Order confirmation email error:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Status Update Emails
  const statuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
  
  for (const status of statuses) {
    console.log(`📧 Test 2.${statuses.indexOf(status) + 1}: ${status.toUpperCase()} Status Email`);
    
    try {
      const statusResult = await sendOrderStatusNotification(
        mockOrder,
        status,
        'lapatisseriex@gmail.com' // Using your email for testing
      );

      if (statusResult.success) {
        console.log(`✅ ${status} status email sent successfully`);
        console.log('   Message ID:', statusResult.messageId);
      } else {
        console.log(`❌ ${status} status email failed`);
        console.log('   Error:', statusResult.error);
      }
    } catch (error) {
      console.log(`❌ ${status} status email error:`, error.message);
    }

    console.log(''); // Add spacing between tests
    
    // Add delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay to 2 seconds
  }

  console.log('🎉 Email notification testing completed!');
  console.log('\n📝 Instructions:');
  console.log('1. Check your email inbox at lapatisseriex@gmail.com');
  console.log('2. Verify that all email templates display correctly');
  console.log('3. Test clicking the "Track Your Order" buttons');
  console.log('4. Check spam folder if emails don\'t appear in inbox');
};

// Environment check
const checkEnvironment = () => {
  console.log('🔍 Environment Check:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Using default (http://localhost:5173)');
  console.log('\n');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  Warning: Email credentials not set. Please update your .env file:');
    console.log('EMAIL_USER=your-gmail@gmail.com');
    console.log('EMAIL_PASS=your-app-password');
    console.log('\n💡 For Gmail, use App Password instead of regular password');
    console.log('https://support.google.com/accounts/answer/185833\n');
    return false;
  }
  
  return true;
};

// Run tests
const runTests = async () => {
  if (checkEnvironment()) {
    await testEmailNotifications();
  }
};

// Uncomment the line below to run the tests
// runTests().catch(console.error);

console.log('🚀 Email notification system is ready!');
console.log('📧 Emails will be sent when:');
console.log('   - New orders are created (confirmation email)');
console.log('   - Admin updates order status (status update email)');
console.log('\n🔧 To test manually, uncomment the last line and run: node test-email.js');