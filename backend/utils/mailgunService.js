const formData = require('form-data');
const Mailgun = require('mailgun.js');

class MailgunService {
  constructor() {
    this.apiKey = process.env.MAILGUN_API_KEY;
    this.domain = process.env.MAILGUN_DOMAIN;
    this.fromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@mindwell.app';
    this.fromName = process.env.MAILGUN_FROM_NAME || 'MindWell MHMS';

    if (!this.apiKey || !this.domain) {
      console.warn('⚠️  Mailgun not configured. Set MAILGUN_API_KEY and MAILGUN_DOMAIN in config.env');
      this.configured = false;
      return;
    }

    const mailgun = new Mailgun(formData);
    this.client = mailgun.client({
      username: 'api',
      key: this.apiKey
    });
    
    this.configured = true;
    console.log('✅ Mailgun service initialized');
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.configured) {
      console.log('⚠️  Mailgun not configured, skipping email send');
      return { success: false, error: 'Mailgun not configured' };
    }

    try {
      const messageData = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const result = await this.client.messages.create(this.domain, messageData);
      console.log('✅ Email sent via Mailgun:', result.id);
      return { success: true, messageId: result.id };
    } catch (error) {
      console.error('❌ Mailgun send error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send login notification email
  async sendLoginNotification(userEmail, userName, loginDetails) {
    const { time, device, browser, os, ip, location } = loginDetails;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: bold; min-width: 120px; color: #667eea; }
          .info-value { color: #666; }
          .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Login Alert</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName},</h2>
            <p>We detected a new login to your MindWell account. If this was you, you can safely ignore this email.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #667eea;">Login Details</h3>
              <div class="info-row">
                <span class="info-label">Time:</span>
                <span class="info-value">${time}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Device:</span>
                <span class="info-value">${device}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Browser:</span>
                <span class="info-value">${browser}</span>
              </div>
              <div class="info-row">
                <span class="info-label">OS:</span>
                <span class="info-value">${os}</span>
              </div>
              <div class="info-row">
                <span class="info-label">IP Address:</span>
                <span class="info-value">${ip}</span>
              </div>
              ${location ? `
              <div class="info-row">
                <span class="info-label">Location:</span>
                <span class="info-value">${location}</span>
              </div>
              ` : ''}
            </div>

            <div class="alert">
              <strong>⚠️ Wasn't you?</strong><br>
              If you didn't log in, please secure your account immediately by changing your password.
            </div>

            <p style="color: #666;">
              This is an automated security notification. Stay safe online!
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MindWell MHMS. All rights reserved.</p>
            <p>This email was sent to ${userEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Login Alert - MindWell MHMS
      
      Hi ${userName},
      
      We detected a new login to your account:
      
      Time: ${time}
      Device: ${device}
      Browser: ${browser}
      OS: ${os}
      IP Address: ${ip}
      ${location ? `Location: ${location}` : ''}
      
      If this wasn't you, please secure your account immediately.
      
      © ${new Date().getFullYear()} MindWell MHMS
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🔐 New Login to Your MindWell Account',
      html,
      text
    });
  }

  // Send welcome email
  async sendWelcomeEmail(userEmail, userName) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 32px; }
          .content { background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px; }
          .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .feature { padding: 15px 0; border-bottom: 1px solid #eee; }
          .feature:last-child { border-bottom: none; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to MindWell!</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName}! 👋</h2>
            <p>Thank you for joining MindWell Mental Health Management System. We're excited to support you on your mental health journey!</p>
            
            <div class="features">
              <h3 style="margin-top: 0; color: #667eea;">What you can do:</h3>
              <div class="feature">📊 <strong>Track Daily Mood</strong> - Monitor your mental health with our intuitive mood tracking</div>
              <div class="feature">📝 <strong>Complete Assessments</strong> - Get insights with professional mental health assessments</div>
              <div class="feature">📈 <strong>View Analytics</strong> - See trends and patterns in your mental health data</div>
              <div class="feature">🤖 <strong>AI Recommendations</strong> - Receive personalized mental health recommendations</div>
              <div class="feature">👥 <strong>Find Providers</strong> - Connect with mental health professionals</div>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">
                🚀 Get Started
              </a>
            </div>

            <p style="color: #666; margin-top: 30px;">
              Need help? We're here for you. Reply to this email anytime!
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MindWell MHMS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🎉 Welcome to MindWell - Your Mental Health Journey Starts Here!',
      html
    });
  }

  // Send OTP email for password reset
  async sendOTPEmail(userEmail, otp) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 3px solid #667eea; border-radius: 15px; padding: 30px; text-align: center; margin: 25px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          .otp-code { color: #667eea; font-size: 48px; font-weight: bold; letter-spacing: 10px; margin: 0; }
          .otp-label { color: #999; margin: 10px 0 0 0; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .warning-text { color: #856404; margin: 0; font-size: 14px; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password for your MindWell account. Use the OTP code below to proceed:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p class="otp-label">Your 6-digit OTP code</p>
            </div>

            <div class="warning">
              <p class="warning-text">
                <strong>⚠️ Important:</strong> This OTP will expire in 10 minutes for security reasons.
              </p>
            </div>

            <p style="color: #666;">
              If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              For security, never share this code with anyone.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MindWell MHMS. All rights reserved.</p>
            <p>This email was sent to ${userEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request - MindWell MHMS
      
      You requested to reset your password for your MindWell account.
      
      Your OTP Code: ${otp}
      
      ⚠️ Important: This OTP will expire in 10 minutes for security reasons.
      
      If you didn't request this password reset, please ignore this email.
      
      © ${new Date().getFullYear()} MindWell MHMS
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '🔐 Password Reset OTP - MindWell MHMS',
      html,
      text
    });
  }

  // Send password reset confirmation
  async sendPasswordResetConfirmation(userEmail, userName) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
          .success-icon { font-size: 48px; margin: 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Reset Successful</h1>
          </div>
          <div class="content">
            <div class="success-box">
              <div class="success-icon">🔒</div>
              <h2 style="color: #155724; margin: 10px 0;">Password Changed!</h2>
            </div>

            <h2>Hi ${userName},</h2>
            <p>Your password has been successfully reset. You can now log in to your MindWell account using your new password.</p>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">
                🚀 Login to Your Account
              </a>
            </div>

            <div class="warning">
              <p style="color: #856404; margin: 0;">
                <strong>🔒 Security Note:</strong> If you didn't perform this password reset, please contact support immediately.
              </p>
            </div>

            <p style="color: #666; margin-top: 30px;">
              For your security:
            </p>
            <ul style="color: #666;">
              <li>Never share your password with anyone</li>
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication if available</li>
            </ul>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MindWell MHMS. All rights reserved.</p>
            <p>This email was sent to ${userEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: '✅ Password Reset Successful - MindWell MHMS',
      html
    });
  }

  // Strip HTML tags for plain text version
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

module.exports = new MailgunService();
