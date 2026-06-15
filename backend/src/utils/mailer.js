const nodemailer = require('nodemailer');
    
    const isDev = !process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS;
    
    const transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
      }
    });
    
    const sendOTP = async (to, otp) => {
      if (isDev) {
        console.log('\n========================================');
        console.log('[DEV MODE] OTP Email (Mailtrap not configured)');
        console.log('To: ${to}');
        console.log('OTP: ${otp}');
        console.log('Valid for: 10 minutes');
        console.log('========================================\n');
        return;
      }
    
      try {
        await transporter.sendMail({
          from: 'support@vouched.com',
          to,
          subject: `Your OTP: ${otp}`,
          html: `<html><body><h1>Your OTP: ${otp}</h1></body></html>`,
          text: `Your OTP is: ${otp}. Valid for 10 minutes.`
        });
        console.log('Email sent successfully to ${to}');
      } catch (err) {
        console.error('Failed to send email to ${to}:', err.message);
        throw err;
      }
    };
    
    module.exports = { sendOTP };