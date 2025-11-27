const emailService = require('./utils/simpleEmailService');

async function testEmail() {
  console.log('🧪 Testing Email Service\n');
  
  try {
    // Test 1: Check if GMAIL_APP_PASSWORD is set
    if (!process.env.GMAIL_APP_PASSWORD) {
      console.log('❌ GMAIL_APP_PASSWORD not set in environment');
      console.log('💡 Add it to your .env file first');
      return;
    }
    
    console.log('✅ GMAIL_APP_PASSWORD is configured');
    
    // Test 2: Test welcome email
    console.log('\n📧 Testing welcome email...');
    const welcomeResult = await emailService.sendWelcomeEmail(
      'sri.uddesh11@gmail.com', // Send to yourself for testing
      'Test User'
    );
    
    if (welcomeResult.success) {
      console.log('✅ Welcome email sent successfully!');
      console.log('📧 Message ID:', welcomeResult.messageId);
    } else {
      console.error('❌ Welcome email failed:', welcomeResult.error);
    }
    
    // Test 3: Test OTP email
    console.log('\n🔐 Testing OTP email...');
    const otpResult = await emailService.sendOTPEmail(
      'sri.uddesh11@gmail.com', // Send to yourself for testing
      '123456'
    );
    
    if (otpResult.success) {
      console.log('✅ OTP email sent successfully!');
      console.log('📧 Message ID:', otpResult.messageId);
    } else {
      console.error('❌ OTP email failed:', otpResult.error);
    }
    
    console.log('\n🎉 Email tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEmail();
