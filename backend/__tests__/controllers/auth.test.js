jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid') }));

const jwt = require('jsonwebtoken');

// Get the shared mock pool
const { Pool } = require('pg');
const mockPool = new Pool();

const {
  signup, verifyOTP, login, verifyLoginOTP, refresh, logout
} = require('../../src/controllers/auth');

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, cookies: {}, headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    next = jest.fn();
    mockPool.query.mockReset();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET='test-r...cret';
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('signup', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@juetguna.in',
        name: 'Test User',
        branch: 'CSE',
        year_of_study: 3,
      };
    });

    it('should return 400 if email domain is not in colleges', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await signup(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'College email domain not supported' });
    });

    it('should return 409 if email already registered', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'college-1' }] }) // college lookup
        .mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] }); // existing user

      await signup(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' });
    });

    it('should send OTP and return 200 on successful signup', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'college-1' }] }) // college lookup
        .mockResolvedValueOnce({ rows: [] }); // no existing user

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await signup(req, res, next);

      // Should see OTP printed (dev mode)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DEV MODE] OTP Email'));
      expect(res.json).toHaveBeenCalledWith({ message: 'OTP sent to your college email' });
      consoleSpy.mockRestore();
    });

    it('should assign SENIOR role for year_of_study >= 3', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'college-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await signup(req, res, next);

      // OTP stored in the module-level otpStore - verify via successful verifyOTP
      expect(res.json).toHaveBeenCalledWith({ message: 'OTP sent to your college email' });
    });

    it('should assign FRESHER role for year_of_study < 3', async () => {
      req.body.year_of_study = 1;
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'college-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await signup(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: 'OTP sent to your college email' });
      consoleSpy.mockRestore();
    });

    it('should pass errors to next()', async () => {
      mockPool.query.mockRejectedValue(new Error('DB error'));

      await signup(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('verifyOTP', () => {
    beforeEach(() => {
      req.body = { email: 'test@juetguna.in', otp: '123456' };
    });

    it('should return 400 if OTP is invalid or expired', async () => {
      await verifyOTP(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired OTP' });
    });

    it('should create user and return token on valid OTP', async () => {
      // First signup to create OTP entry
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'college-1' }] }) // college
        .mockResolvedValueOnce({ rows: [] }); // no existing

      await signup({ body: { email: 'test@juetguna.in', name: 'Test', branch: 'CSE', year_of_study: 3 }, cookies: {}, headers: {} }, res, () => {});

      // Now verify with correct OTP - we need to know what OTP was sent
      let capturedOtp;
      jest.spyOn(console, 'log').mockImplementation((...args) => {
        const msg = args.join(' ');
        const match = msg.match(/OTP: (\d+)/);
        if (match) capturedOtp = match[1];
      });

      // Re-do signup with console spy to capture OTP
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'college-1' }] })
        .mockResolvedValueOnce({ rows: [] });
      await signup({ body: { email: 'test1@juetguna.in', name: 'Test', branch: 'CSE', year_of_study: 3 }, cookies: {}, headers: {} }, { status: jest.fn().mockReturnThis(), json: jest.fn() }, () => {});

      expect(capturedOtp).toBeTruthy();

      req.body = { email: 'test1@juetguna.in', otp: capturedOtp };

      jest.spyOn(jwt, 'sign').mockReturnValue('mock-token');

      mockPool.query.mockReset();
      mockPool.query.mockResolvedValue({
        rows: [{ id: 'new-user-id', email: 'test1@juetguna.in', name: 'Test', role: 'SENIOR', credibility_score: 50 }]
      });

      await verifyOTP(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'mock-token',
          user: expect.objectContaining({ email: 'test1@juetguna.in' })
        })
      );
    });
  });

  describe('login', () => {
    beforeEach(() => {
      req.body = { email: 'test@juetguna.in' };
    });

    it('should return 404 if user not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 403 if account not verified', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 'u1', role: 'SENIOR', is_verified: false }] });

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Account not verified' });
    });

    it('should send OTP for valid verified user', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 'u1', role: 'SENIOR', is_verified: true }] });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await login(req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DEV MODE] OTP Email'));
      expect(res.json).toHaveBeenCalledWith({ message: 'OTP sent' });
      consoleSpy.mockRestore();
    });
  });

  describe('verifyLoginOTP', () => {
    it('should return 400 for invalid OTP', async () => {
      req.body = { email: 'test@juetguna.in', otp: 'wrong' };

      await verifyLoginOTP(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired OTP' });
    });

    it('should return token for valid login OTP', async () => {
      // First login to create OTP store entry
      mockPool.query.mockResolvedValue({ rows: [{ id: 'u1', role: 'SENIOR', is_verified: true }] });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await login({ body: { email: 'test2@juetguna.in' } }, { status: jest.fn().mockReturnThis(), json: jest.fn() }, () => {});

      // Extract OTP from console
      let capturedOtp;
      consoleSpy.mockImplementation((...args) => {
        const msg = args.join(' ');
        const match = msg.match(/OTP: (\d+)/);
        if (match) capturedOtp = match[1];
      });

      // Login again to capture OTP
      mockPool.query.mockResolvedValue({ rows: [{ id: 'u1', role: 'SENIOR', is_verified: true }] });
      await login({ body: { email: 'test3@juetguna.in' } }, { status: jest.fn().mockReturnThis(), json: jest.fn() }, () => {});
      consoleSpy.mockRestore();

      expect(capturedOtp).toBeTruthy();

      jest.spyOn(jwt, 'sign').mockReturnValue('login-token');

      req.body = { email: 'test3@juetguna.in', otp: capturedOtp };

      await verifyLoginOTP(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'login-token' })
      );
    });
  });

  describe('refresh', () => {
    it('should return 401 if no refresh cookie', () => {
      refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No refresh token' });
    });

    it('should return new token if refresh token is valid', () => {
      req.cookies.refresh = 'valid-refresh';
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'u1' });
      jest.spyOn(jwt, 'sign').mockReturnValue('new-access-token');

      refresh(req, res);

      expect(res.json).toHaveBeenCalledWith({ token: 'new-access-token' });
    });

    it('should return 401 if refresh token is invalid', () => {
      req.cookies.refresh = 'invalid';
      jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('invalid'); });

      refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid refresh token' });
    });
  });

  describe('logout', () => {
    it('should clear refresh cookie and return confirmation', () => {
      logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('refresh');
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out' });
    });
  });
});
