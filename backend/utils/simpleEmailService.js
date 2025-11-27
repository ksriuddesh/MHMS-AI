const { MailtrapClient } = require("mailtrap");

// In-memory storage for OTPs and user data
const otpStore = new Map();
const userStore = new Map();

class SimpleEmailService {
  constructor() {
    // Initialize Mailtrap API client
    this.client = new MailtrapClient({
      token: process.env.MAILTRAP_API_TOKEN || "f6b1264fcf9de19ee067bc17bc0c1759", // Your API token
      testInboxId: 3985618, // Your inbox ID
    });

    // Configure sender details
    this.sender = {
      email: "noreply@mindwell.app",
      name: "MindWell MHMS"
    };
  }

  // Generate OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP in memory with enhanced security
  storeOTP(email, otp) {
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    otpStore.set(email, {
      otp,
      expiry,
      attempts: 0,
      createdAt: new Date(),
      verified: false
    });
  }

  // Verify OTP with enhanced validation
  verifyOTP(email, otp) {
    const stored = otpStore.get(email);
    if (!stored) return false;
    
    // Check if OTP has expired
    if (new Date() > stored.expiry) {
      otpStore.delete(email);
      return false;
    }
    
    // Check if too many attempts
    if (stored.attempts >= 3) {
      otpStore.delete(email);
      return false;
    }
    
    // Verify OTP
    if (stored.otp === otp) {
      stored.verified = true;
      stored.verifiedAt = new Date();
      otpStore.set(email, stored);
      return true;
    }
    
    // Increment attempts
    stored.attempts += 1;
    otpStore.set(email, stored);
    return false;
  }

  // Check if OTP is verified (for password reset flow)
  isOTPVerified(email) {
    const stored = otpStore.get(email);
    return stored && stored.verified;
  }

  // Send email using Mailtrap API
  async sendEmail(recipientEmail, subject, htmlContent, textContent = null) {
    try {
      const recipients = [{ email: recipientEmail }];
      
      const emailData = {
        from: this.sender,
        to: recipients,
        subject: subject,
        html: htmlContent,
        category: "MindWell MHMS"
      };

      // Add text content if provided
      if (textContent) {
        emailData.text = textContent;
      }

      const result = await this.client.testing.send(emailData);
      console.log('✅ Email sent successfully via Mailtrap API:', result);
      return { success: true, messageId: result.message_id || result.id };
    } catch (error) {
      console.error('❌ Failed to send email via Mailtrap API:', error);
      return { success: false, error: error.message };
    }
  }

  // Send welcome email
  async sendWelcomeEmail(userEmail, userName) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🧠 MindWell MHMS</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Welcome aboard, ${userName}! 🎉</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for choosing MindWell Mental Health Management System! We're excited to have you on board.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Your account has been successfully created and you can now:
          </p>
          <ul style="color: #666; line-height: 1.6;">
            <li>📊 Track your daily mood and mental health</li>
            <li>📝 Complete mental health assessments</li>
            <li>📚 Access resources and support</li>
            <li>👥 Connect with mental health providers</li>
          </ul>
          <p style="color: #666; line-height: 1.6;">
            If you have any questions or need support, please don't hesitate to reach out.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              🚀 Get Started
            </a>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 12px;">
              © 2024 MindWell MHMS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
      Welcome aboard, ${userName}!
      
      Thank you for choosing MindWell Mental Health Management System! We're excited to have you on board.
      
      Your account has been successfully created and you can now:
      - Track your daily mood and mental health
      - Complete mental health assessments
      - Access resources and support
      - Connect with mental health providers
      
      If you have any questions or need support, please don't hesitate to reach out.
      
      Get Started: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard
      
      © 2024 MindWell MHMS. All rights reserved.
    `;

    return await this.sendEmail(
      userEmail,
      'Welcome to MindWell - Mental Health Management System',
      htmlContent,
      textContent
    );
  }

  // Send OTP email with enhanced design
  async sendOTPEmail(userEmail, otp) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔐 Password Reset</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #666; line-height: 1.6;">
            You have requested to reset your password for your MindWell MHMS account. 
            Use the following OTP code to proceed:
          </p>
          <div style="background: #fff; border: 3px solid #667eea; border-radius: 15px; padding: 25px; text-align: center; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h1>
            <p style="color: #999; margin: 10px 0 0 0; font-size: 14px;">Your 6-digit OTP code</p>
          </div>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>⚠️ Important:</strong> This OTP will expire in 10 minutes for security reasons.
            </p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            If you didn't request this password reset, please ignore this email and your password will remain unchanged.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 12px;">
              © 2024 MindWell MHMS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
      Password Reset Request
      
      You have requested to reset your password for your MindWell MHMS account.
      Use the following OTP code to proceed:
      
      OTP Code: ${otp}
      
      ⚠️ Important: This OTP will expire in 10 minutes for security reasons.
      
      If you didn't request this password reset, please ignore this email and your password will remain unchanged.
      
      © 2024 MindWell MHMS. All rights reserved.
    `;

    return await this.sendEmail(
      userEmail,
      '🔐 Password Reset OTP - MindWell MHMS',
      htmlContent,
      textContent
    );
  }

  // Send password reset confirmation email
  async sendPasswordResetConfirmation(userEmail, userName) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Password Reset Complete</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hello ${userName},</h2>
          <p style="color: #666; line-height: 1.6;">
            Your password has been successfully reset. You can now log in to your MindWell MHMS account using your new password.
          </p>
          <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #155724; margin: 0; font-size: 14px;">
              <strong>🔒 Security Note:</strong> If you didn't perform this password reset, please contact our support team immediately.
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
               style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              🚀 Login Now
            </a>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 12px;">
              © 2024 MindWell MHMS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
      Password Reset Complete
      
      Hello ${userName},
      
      Your password has been successfully reset. You can now log in to your MindWell MHMS account using your new password.
      
      🔒 Security Note: If you didn't perform this password reset, please contact our support team immediately.
      
      Login Now: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login
      
      © 2024 MindWell MHMS. All rights reserved.
    `;

    return await this.sendEmail(
      userEmail,
      '✅ Password Reset Successful - MindWell MHMS',
      htmlContent,
      textContent
    );
  }

  // Send password reset email (legacy method - kept for compatibility)
  async sendPasswordResetEmail(userEmail, resetToken) {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔑 Password Reset</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #666; line-height: 1.6;">
            You have requested to reset your password for the MindWell MHMS.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Please click the following button to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              🔑 Reset Password
            </a>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; color: #666; background: #f0f0f0; padding: 10px; border-radius: 5px;">
            ${resetLink}
          </p>
          <p style="color: #666; font-size: 14px;">
            <strong>This link will expire in 1 hour for security reasons.</strong>
          </p>
          <p style="color: #666; line-height: 1.6;">
            If you didn't request this password reset, please ignore this email.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 12px;">
              © 2024 MindWell MHMS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
      Password Reset Request
      
      You have requested to reset your password for the MindWell MHMS.
      
      Please click the following link to reset your password:
      ${resetLink}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this password reset, please ignore this email.
      
      © 2024 MindWell MHMS. All rights reserved.
    `;

    return await this.sendEmail(
      userEmail,
      'Password Reset Request - MindWell MHMS',
      htmlContent,
      textContent
    );
  }

  // Get stored OTP data
  getOTPData(email) {
    return otpStore.get(email);
  }

  // Clear OTP data
  clearOTP(email) {
    otpStore.delete(email);
  }

  // Get all stored data (for debugging)
  getAllData() {
    return {
      otpStore: Object.fromEntries(otpStore),
      userStore: Object.fromEntries(userStore)
    };
  }

  // Clean up expired OTPs (call this periodically)
  cleanupExpiredOTPs() {
    const now = new Date();
    for (const [email, data] of otpStore.entries()) {
      if (now > data.expiry) {
        otpStore.delete(email);
      }
    }
  }

  // Test Mailtrap API connection
  async testConnection() {
    try {
      // Try to send a test email
      const result = await this.sendEmail(
        "test@example.com",
        "🧪 Test Email - MindWell MHMS",
        "<h1>Test Email</h1><p>This is a test email to verify Mailtrap API connection.</p>",
        "Test Email\n\nThis is a test email to verify Mailtrap API connection."
      );
      
      if (result.success) {
        console.log('✅ Mailtrap API connection successful!');
        return true;
      } else {
        console.error('❌ Mailtrap API connection failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Mailtrap API connection error:', error);
      return false;
    }
  }
}

module.exports = new SimpleEmailService();
