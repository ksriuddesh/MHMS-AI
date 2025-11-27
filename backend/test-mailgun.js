// Test Mailgun Email Service
require('dotenv').config({ path: './config.env' });
const mailgunService = require('./utils/mailgunService');

async function testMailgunEmails() {
  console.log('🧪 Testing Mailgun Email Service\n');
  console.log('=====================================');

  // Test credentials
  console.log('\n📋 Configuration:');
  console.log('API Key:', process.env.MAILGUN_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('Domain:', process.env.MAILGUN_DOMAIN || '❌ Missing');
  console.log('From Email:', process.env.MAILGUN_FROM_EMAIL || 'Using default');

  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.log('\n❌ Mailgun not configured!');
    console.log('Please set MAILGUN_API_KEY and MAILGUN_DOMAIN in config.env');
    return;
  }

  // Test email address (change this to your email)
  const testEmail = 'sri.uddesh11@gmail.com';
  const testName = 'Sri Uddesh Kancheti';

  console.log('\n📧 Sending test emails to:', testEmail);
  console.log('=====================================\n');

  // Test 1: Welcome Email
  console.log('1️⃣  Testing Welcome Email...');
  try {
    const welcomeResult = await mailgunService.sendWelcomeEmail(testEmail, testName);
    if (welcomeResult.success) {
      console.log('✅ Welcome email sent! Message ID:', welcomeResult.messageId);
    } else {
      console.log('❌ Welcome email failed:', welcomeResult.error);
    }
  } catch (error) {
    console.log('❌ Welcome email error:', error.message);
  }

  // Wait a bit between emails
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Login Notification
  console.log('\n2️⃣  Testing Login Notification Email...');
  try {
    const loginResult = await mailgunService.sendLoginNotification(testEmail, testName, {
      time: new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' }),
      device: 'Desktop',
      browser: 'Chrome',
      os: 'Windows 11',
      ip: '192.168.1.100',
      location: 'Test Location'
    });
    if (loginResult.success) {
      console.log('✅ Login notification sent! Message ID:', loginResult.messageId);
    } else {
      console.log('❌ Login notification failed:', loginResult.error);
    }
  } catch (error) {
    console.log('❌ Login notification error:', error.message);
  }

  console.log('\n=====================================');
  console.log('📬 Check your inbox at:', testEmail);
  console.log('💡 Also check spam folder if not received');
  console.log('🌐 View Mailgun logs at: https://app.mailgun.com/');
}

testMailgunEmails().catch(console.error);
