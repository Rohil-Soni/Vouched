const nodemailer = require('nodemailer');

const isDev = !process.env.SMTP_USER || process.env.SMTP_USER === 'placeholder@gmail.com';

const transporter = isDev ? null : nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendOTP = (to, otp) => {
  if (isDev) {
    console.log(`\n[DEV] OTP for ${to}: ${otp}\n`);
    return Promise.resolve();
  }
  return transporter.sendMail({
    from: `"Vouched" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your Vouched verification code',
    text: `Your OTP is: ${otp}. Valid for 10 minutes.`,
  });
};

module.exports = { sendOTP };
