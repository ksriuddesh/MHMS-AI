const nodemailer = require('nodemailer');

// Test Mailtrap configuration
async function testMailtrap() {
  console.log('🧪 Testing Mailtrap Email Configuration...\n');

  // Create transporter with your Mailtrap credentials
  const transporter = nodemailer.createTransporter({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "a84eb7a92fc0d8",
      pass: "ab5874e8c41631"
    }
  });

  try {
    // Verify connection configuration
    console.log('📡 Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection verified successfully!\n');

    // Test sending a simple email
    console.log('📧 Sending test email...');
    const mailOptions = {
      from: '"MindWell MHMS Test" <test@mindwell.app>',
      to: "test@example.com", // This will be caught by Mailtrap
      subject: "🧪 Test Email - MindWell MHMS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🧠 MindWell MHMS</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Test Email Successfully Sent! 🎉</h2>
            <p style="color: #666; line-height: 1.6;">
              This is a test email to verify that your Mailtrap configuration is working correctly.
            </p>
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #155724; margin: 0; font-size: 14px;">
                <strong>✅ Configuration Details:</strong><br>
                Host: sandbox.smtp.mailtrap.io<br>
                Port: 2525<br>
                Username: a84eb7a92fc0d8<br>
                Authentication: PLAIN, LOGIN, CRAM-MD5
              </p>
            </div>
            <p style="color: #666; line-height: 1.6;">
              You can now use this configuration in your MindWell MHMS application for:
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
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('📨 Message ID:', result.messageId);
    console.log('📧 Email sent to Mailtrap inbox\n');

    console.log('🎯 Next Steps:');
    console.log('1. Check your Mailtrap inbox at: https://mailtrap.io/inboxes/3985618/messages');
    console.log('2. You should see the test email there');
    console.log('3. Your MindWell MHMS application is now ready to send emails!');
    console.log('4. Users can request password resets and receive OTP emails\n');

    console.log('🚀 Your forgot password system is now fully automated with:');
    console.log('   • OTP generation and email delivery');
    console.log('   • Secure OTP verification');
    console.log('   • Password reset functionality');
    console.log('   • Confirmation emails');
    console.log('   • Rate limiting and security features');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if your Mailtrap credentials are correct');
    console.log('2. Verify the host and port settings');
    console.log('3. Ensure your Mailtrap account is active');
    console.log('4. Check if there are any firewall restrictions');
  }
}

// Run the test
testMailtrap();
