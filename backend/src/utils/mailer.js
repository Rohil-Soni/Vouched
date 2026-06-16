const https = require('https');

const isDev = !process.env.SENDGRID_API_KEY;

const buildEmailTemplate = (otp) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f8;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header with Vouched branding -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 50%,#5b21b6 100%);padding:40px 30px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="vertical-align:middle;">
                    <!-- Vouched SVG Logo -->
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="24" cy="24" r="22" fill="white" opacity="0.15"/>
                      <path d="M20 28L16 24L14 26L20 32L34 18L32 16L20 28Z" fill="white"/>
                      <path d="M24 12C17.3726 12 12 17.3726 12 24C12 30.6274 17.3726 36 24 36C30.6274 36 36 30.6274 36 24C36 17.3726 30.6274 12 24 12Z" stroke="white" stroke-width="2.5" fill="none" opacity="0.3"/>
                    </svg>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:1px;">VOUCHED</span>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0 0;font-size:15px;color:rgba(255,255,255,0.85);">Verify your email address</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:35px 30px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:18px;font-weight:600;color:#1f2937;">Hey there!</p>
              <p style="margin:0 0 20px 0;font-size:15px;color:#6b7280;line-height:1.5;">
                Welcome to <strong style="color:#7c3aed;">Vouched</strong>! Use the code below to verify your email and get started.
              </p>

              <!-- OTP Box -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;background-color:#f5f3ff;border:2px solid #7c3aed;border-radius:12px;padding:24px 48px;">
                <tr>
                  <td style="font-size:36px;font-weight:700;letter-spacing:8px;color:#7c3aed;font-family:'Courier New',monospace;text-align:center;">
                    ${otp}
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;font-size:13px;color:#ef4444;font-weight:600;">
                &#9200; Valid for only 10 minutes
              </p>

              <p style="margin:20px 0 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">
                Didn't request this? You can safely ignore this email.<br/>
                Only someone with access to this email can create an account.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;"></table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                &copy; 2026 <strong style="color:#7c3aed;">Vouched</strong>. All rights reserved.
              </p>
              <p style="margin:4px 0 0 0;font-size:11px;color:#d1d5db;">
                This is an automated message, please don't reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const sendOTP = async (to, otp) => {
  if (isDev) {
    console.log(`\n========================================`);
    console.log(`[DEV MODE] OTP Email (SendGrid API not configured)`);
    console.log(`To: ${to}`);
    console.log(`OTP: ${otp}`);
    console.log(`========================================\n`);
    return;
  }

  const htmlContent = buildEmailTemplate(otp);

  const data = JSON.stringify({
    personalizations: [
      {
        to: [{ email: to }],
        subject: `Your Vouched verification code: ${otp}`
      }
    ],
    from: { email: 'support.vouched@gmail.com', name: 'Vouched' },
    content: [
      {
        type: 'text/plain',
        value: `Your OTP is: ${otp}. Valid for 10 minutes.`
      },
      {
        type: 'text/html',
        value: htmlContent
      }
    ]
  });

  const options = {
    hostname: 'api.sendgrid.com',
    path: '/v3/mail/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 202) {
          console.log(`[MAILER] Email sent successfully to ${to}`);
          resolve(true);
        } else {
          console.error(`[MAILER] Failed: ${res.statusCode} - ${body}`);
          reject(new Error('SendGrid API error'));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`[MAILER] Failed to send email to ${to}:`, err.message);
      reject(err);
    });

    req.write(data);
    req.end();
  });
};

module.exports = { sendOTP };
