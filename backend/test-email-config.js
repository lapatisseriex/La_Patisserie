// Test Email Configuration Script
// Run this to verify SMTP settings and test email sending
// Usage: node test-email-config.js

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import nodemailer from 'nodemailer';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from backend directory
const envPath = join(__dirname, '.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  process.exit(1);
}

console.log('\n🔍 ===== EMAIL CONFIGURATION TEST =====\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST || '❌ NOT SET');
console.log('  SMTP_PORT:', process.env.SMTP_PORT || '❌ NOT SET');
console.log('  SMTP_SECURE:', process.env.SMTP_SECURE || '❌ NOT SET');
console.log('  SMTP_USER:', process.env.SMTP_USER ? '✅ SET' : '❌ NOT SET');
console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE || '❌ NOT SET');
console.log('  EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET (hidden)' : '❌ NOT SET');
console.log();

// Determine configuration to use
let transporterConfig;
let configType;

if (process.env.SMTP_HOST) {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  
  configType = 'EXPLICIT SMTP';
  transporterConfig = {
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  };
} else if (String(process.env.EMAIL_SERVICE).toLowerCase() === 'gmail') {
  configType = 'GMAIL SERVICE';
  transporterConfig = {
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };
} else {
  configType = 'DEFAULT GMAIL SMTP';
  transporterConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };
}

console.log(`📧 Using Configuration Type: ${configType}`);
console.log('📦 Transporter Config:', JSON.stringify(transporterConfig, null, 2));
console.log();

// Create transporter
console.log('🔧 Creating transporter...');
const transporter = nodemailer.createTransport(transporterConfig);
console.log('✅ Transporter created');
console.log();

// Verify connection
console.log('🔍 Verifying SMTP connection...');
try {
  await transporter.verify();
  console.log('✅ SMTP connection verified successfully!');
  console.log();
  
  // Ask if user wants to send test email
  const testEmail = process.env.EMAIL_USER || 'test@example.com';
  console.log(`📧 Sending test email to ${testEmail}...`);
  
  const info = await transporter.sendMail({
    from: { name: 'La Patisserie Test', address: process.env.EMAIL_USER },
    to: testEmail,
    subject: 'Test Email - La Patisserie',
    html: '<h2>Test Email</h2><p>This is a test email from La Patisserie backend.</p><p>If you receive this, your email configuration is working correctly!</p>',
    text: 'Test Email\n\nThis is a test email from La Patisserie backend.\n\nIf you receive this, your email configuration is working correctly!'
  });
  
  console.log('✅ Test email sent successfully!');
  console.log('📨 Message ID:', info.messageId);
  console.log('📊 Response:', JSON.stringify(info, null, 2));
  console.log();
  console.log('🎉 EMAIL CONFIGURATION IS WORKING!');
  
} catch (error) {
  console.error('\n❌ ===== EMAIL CONFIGURATION ERROR =====');
  console.error('Error Name:', error.name);
  console.error('Error Code:', error.code);
  console.error('Error Message:', error.message);
  
  if (error.code === 'EAUTH') {
    console.error('\n⚠️  AUTHENTICATION FAILED:');
    console.error('   - Check EMAIL_USER is correct');
    console.error('   - Check EMAIL_PASS is correct');
    console.error('   - For Gmail: Enable "App Passwords" and use that instead of your regular password');
    console.error('   - For Gmail: Go to https://myaccount.google.com/apppasswords');
  } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
    console.error('\n⚠️  CONNECTION FAILED:');
    console.error('   - Check SMTP_HOST is correct');
    console.error('   - Check SMTP_PORT is correct');
    console.error('   - Check firewall allows SMTP connections');
    console.error('   - Check network connectivity');
  } else if (error.code === 'ESOCKET') {
    console.error('\n⚠️  SOCKET ERROR:');
    console.error('   - Check if SSL/TLS settings are correct (SMTP_SECURE)');
    console.error('   - Try secure: true for port 465, false for port 587');
  }
  
  console.error('\nFull Error:', error);
  console.error('========================================\n');
  process.exit(1);
}

console.log('\n========================================\n');
