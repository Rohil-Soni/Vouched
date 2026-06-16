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
<body style="margin:0;padding:0;background-color:#fcf8f4;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fcf8f4;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.06);">

          <!-- Header with Vouched branding -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316 0%,#f43f5e 50%,#eab308 100%);padding:40px 30px;text-align:center;">
              <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">VOUCHED</span>
              <p style="margin:8px 0 0 0;font-size:15px;color:rgba(255,255,255,0.9);">Verify your email address</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:35px 30px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:#1a1410;">Hey there!</p>
              <p style="margin:0 0 20px 0;font-size:15px;color:#5c4f44;line-height:1.6;">
                Welcome to <strong style="color:#f97316;">Vouched</strong>! Use the code below to verify your email.
              </p>

              <!-- OTP Box -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;background-color:#fff7ed;border:2px solid #fb923c;border-radius:12px;padding:24px 48px;">
                <tr>
                  <td style="font-size:36px;font-weight:800;letter-spacing:8px;color:#ea580c;font-family:'Inter',monospace;text-align:center;">
                    ${otp}
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;font-size:13px;color:#f43f5e;font-weight:600;">
                &#9200; Valid for only 10 minutes
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px;text-align:center;background:#fcf8f4;">
              <p style="margin:0;font-size:12px;color:#9c8a7a;">
                &copy; 2026 Vouched. All rights reserved.
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
