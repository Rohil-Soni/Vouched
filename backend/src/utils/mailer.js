const https = require('https');

// Use SendGrid when API key is set, otherwise fall back to dev mode
const isDev = !process.env.SENDGRID_API_KEY;

const sendOTP = async (to, otp) => {
  if (isDev) {
    console.log(`\n========================================`);
    console.log(`[DEV MODE] OTP Email (SendGrid API not configured)`);
    console.log(`To: ${to}`);
    console.log(`OTP: ${otp}`);
    console.log(`========================================\n`);
    return;
  }

  const data = JSON.stringify({
    personalizations: [
      {
        to: [{ email: to }],
        subject: `Your OTP: ${otp}`
      }
    ],
    from: { email: 'support.vouched@gmail.com', name: 'Vouched Support' },
    content: [
      {
        type: 'text/plain',
        value: `Your OTP is: ${otp}. Valid for 10 minutes.`
      },
      {
        type: 'text/html',
        value: `<html><body><h1>Your OTP: ${otp}</h1></body></html>`
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
      'Content-Length': data.length
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
