jest.mock('nodemailer');

const nodemailer = require('nodemailer');

describe('Mailer Utility', () => {
  describe('sendOTP in dev mode', () => {
    it('should log OTP to console and resolve when SMTP_USER is placeholder', async () => {
      const { sendOTP } = require('../../src/utils/mailer');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await sendOTP('test@juetguna.in', '123456');

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEV MODE] OTP Email')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('123456')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('sendOTP with real SMTP', () => {
    const ORIGINAL_SMTP_USER = process.env.SMTP_USER;

    afterAll(() => {
      process.env.SMTP_USER = ORIGINAL_SMTP_USER;
    });

    it('should configure transporter and send email via nodemailer', async () => {
      process.env.SMTP_USER = 'real@gmail.com';
      process.env.SMTP_PASS = 'real-pass';
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_PORT = '587';

      const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'abc' });
      nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

      let sendOTP;
      jest.isolateModules(() => {
        sendOTP = require('../../src/utils/mailer').sendOTP;
      });

      await sendOTP('user@juetguna.in', '654321');

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: '587',
        secure: false,
        auth: { user: 'real@gmail.com', pass: 'real-pass' },
      });
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@juetguna.in',
          subject: expect.stringContaining('654321'),
        })
      );
    });

    it('should throw error if transporter.sendMail fails', async () => {
      process.env.SMTP_USER = 'real@gmail.com';
      process.env.SMTP_PASS = 'real-pass';

      const sendMailMock = jest.fn().mockRejectedValue(new Error('SMTP error'));
      nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

      let sendOTP;
      jest.isolateModules(() => {
        sendOTP = require('../../src/utils/mailer').sendOTP;
      });

      await expect(sendOTP('user@juetguna.in', '000000')).rejects.toThrow('SMTP error');
    });
  });
});
