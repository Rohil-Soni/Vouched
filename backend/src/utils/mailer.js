const https = require('https');

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

  // Simplified HTML content to rule out formatting issues
  const htmlContent = `<html><body><h1>Your OTP: ${otp}</h1></body></html>`;

  // Create the payload object
  const payload = {
    from: { email: 'support@vouched.com', name: 'Vouched Support' },
    to: [{ email: to }],
    subject: `Your OTP: ${otp}`,
    html: htmlContent,
    text: `Your OTP is: ${otp}. Valid for 10 minutes.`,
    inbox_ids: parseInt(process.env.MAILTRAP_INBOX_ID) || 4713052
  };

  // Log the payload before stringifying (for debugging)
  console.log('[MAILER] Payload object:', payload);

  // Convert to JSON string
  const data = JSON.stringify(payload);
  
  // Log the JSON string (for debugging)
  console.log('[MAILER] JSON string:', data);

  const options = {
    hostname: 'send.api.mailtrap.io',
    path: '/api/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Token': process.env.MAILTRAP_API_TOKEN,
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[MAILER] Email sent successfully to ${to}`);
          resolve(true);
        } else {
          console.error(`[MAILER] Mailtrap API error:`, responseBody);
          reject(new Error('Mailtrap API error'));
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
