const nodemailer = require('nodemailer');
const fetch = require('node-fetch');  // for Mailtrap API

const isDev = !process.env.MAILTRAP_API_TOKEN;

const sendOTP = async (to, otp) => {
  if (isDev) {
    console.log(`\n========================================`);
    console.log(`[DEV MODE] OTP Email (Mailtrap API not configured)`);
    console.log(`To: ${to}`);
    console.log(`OTP: ${otp}`);
    console.log(`Valid for: 10 minutes`);
    console.log(`========================================\n`);
    return Promise.resolve();
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
      .container { max-width: 500px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
      .header { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 30px; text-align: center; color: white; }
      .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
      .content { padding: 30px; text-align: center; }
      .content p { margin: 12px 0; color: #555; font-size: 16px; line-height: 1.5; }
      .otp-box { background-color: #f0f4ff; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 25px 0; }
      .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #7c3aed; font-family: 'Courier New', monospace; }
      .footer { background-color: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 13px; border-top: 1px solid #eee; }
      .warning { color: #ef4444; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎓 Vouched</h1>
      </div>
      <div class="content">
        <p>Hey! We received a request to verify your email.</p>
        <p>Use the verification code below:</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <p><span class="warning">⏱️ Valid for only 10 minutes</span></p>
        <p style="font-size: 14px; color: #999; margin-top: 20px;">Didn't request this? Ignore this email.</p>
      </div>
      <div class="footer">
        <p>© 2026 Vouched. All rights reserved.</p>
        <p>This is an automated message, please don't reply.</p>
      </div>
    </div>
  </body>
</html>
`;

  try {
    const response = await fetch(`https://send.api.mailtrap.io/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Token': process.env.MAILTRAP_API_TOKEN
      },
      body: JSON.stringify({
        from: {
          email: `support@vouched.com`,
          name: `Vouched Support`
        },
        to: [
          {
            email: to
          }
        ],
        subject: `🔐 Your Vouched verification code: ${otp}`,
        html: htmlContent,
        text: `Your OTP is: ${otp}. Valid for 10 minutes.`,
        inbox_id: process.env.MAILTRAP_INBOX_ID || '1234567'
      })
    });

    if (response.ok) {
      console.log(`[MAILER] Email sent successfully to ${to}`);
      return true;
    } else {
      const error = await response.json();
      console.error(`[MAILER] Failed to send email to ${to}:`, error);
      throw new Error('Mailtrap API error');
    }
  } catch (err) {
    console.error(`[MAILER] Failed to send email to ${to}:`, err.message);
    throw err;
  }
};

module.exports = { sendOTP };
