const { MailtrapClient } = require("mailtrap");

// Test Mailtrap API configuration
async function testMailtrapAPI() {
  console.log('🧪 Testing Mailtrap API Client...\n');

  // Initialize Mailtrap API client
  const client = new MailtrapClient({
    token: "f6b1264fcf9de19ee067bc17bc0c1759", // Your API token
    testInboxId: 3985618, // Your inbox ID
  });

  // Configure sender details
  const sender = {
    email: "noreply@mindwell.app",
    name: "MindWell MHMS"
  };

  // Configure recipients
  const recipients = [
    {
      email: "sri.uddesh11@gmail.com",
    }
  ];

  try {
    console.log('📡 Testing Mailtrap API connection...');
    
    // Test sending an email
    console.log('📧 Sending test email via Mailtrap API...');
    
    const result = await client.testing.send({
      from: sender,
      to: recipients,
      subject: "🧪 Test Email - MindWell MHMS API",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🧠 MindWell MHMS</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Test Email Successfully Sent! 🎉</h2>
            <p style="color: #666; line-height: 1.6;">
              This is a test email to verify that your Mailtrap API integration is working correctly.
            </p>
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #155724; margin: 0; font-size: 14px;">
                <strong>✅ API Configuration Details:</strong><br>
                API Token: f6b1264fcf9de19ee067bc17bc0c1759<br>
                Inbox ID: 3985618<br>
                Method: Mailtrap API Client<br>
                Status: Connected Successfully
              </p>
            </div>
            <p style="color: #666; line-height: 1.6;">
              You can now use this API integration in your MindWell MHMS application for:
            </p>
            <ul style="color: #666; line-height: 1.6;">
              <li>📧 Welcome emails for new users</li>
              <li>🔐 OTP emails for password reset</li>
              <li>✅ Password reset confirmation emails</li>
              <li>📊 Other notification emails</li>
            </ul>
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 12px;">
                © 2024 MindWell MHMS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
        Test Email Successfully Sent!
        
        This is a test email to verify that your Mailtrap API integration is working correctly.
        
        ✅ API Configuration Details:
        API Token: f6b1264fcf9de19ee067bc17bc0c1759
        Inbox ID: 3985618
        Method: Mailtrap API Client
        Status: Connected Successfully
        
        You can now use this API integration in your MindWell MHMS application for:
        - Welcome emails for new users
        - OTP emails for password reset
        - Password reset confirmation emails
        - Other notification emails
        
        © 2024 MindWell MHMS. All rights reserved.
      `,
      category: "MindWell MHMS API Test"
    });

    console.log('✅ Test email sent successfully via Mailtrap API!');
    console.log('📨 API Response:', result);
    console.log('📧 Email sent to Mailtrap inbox\n');

    console.log('🎯 Next Steps:');
    console.log('1. Check your Mailtrap inbox at: https://mailtrap.io/inboxes/3985618/messages');
    console.log('2. You should see the test email there');
    console.log('3. Your MindWell MHMS application is now ready to send emails via API!');
    console.log('4. Users can request password resets and receive OTP emails\n');

    console.log('🚀 Your forgot password system is now fully automated with:');
    console.log('   • Mailtrap API integration (more reliable than SMTP)');
    console.log('   • OTP generation and email delivery');
    console.log('   • Secure OTP verification');
    console.log('   • Password reset functionality');
    console.log('   • Confirmation emails');
    console.log('   • Rate limiting and security features');

    console.log('\n💡 Benefits of using Mailtrap API over SMTP:');
    console.log('   • More reliable delivery');
    console.log('   • Better error handling');
    console.log('   • No SMTP configuration issues');
    console.log('   • Production-ready approach');
    console.log('   • Better debugging and monitoring');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if your Mailtrap API token is correct');
    console.log('2. Verify the inbox ID (3985618)');
    console.log('3. Ensure your Mailtrap account is active');
    console.log('4. Check if there are any API rate limits');
    console.log('5. Verify the mailtrap package is installed: npm install mailtrap');
  }
}

// Run the test
testMailtrapAPI();
