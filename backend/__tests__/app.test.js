jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue({ release: jest.fn() }),
    on: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const request = require('supertest');
const { Pool } = require('pg');
const mockPool = new Pool();
const jwt = require('jsonwebtoken');

// Set env before requiring app
process.env.JWT_SECRET='***';
process.env.JWT_REFRESH_SECRET='test-r...cret';

const app = require('../src/app');

describe('App Integration', () => {
  beforeEach(() => {
    mockPool.query.mockReset();
  });

  describe('Health endpoints', () => {
    it('GET /healthz should return ok', async () => {
      const res = await request(app).get('/healthz');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('GET / should return running message', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Vouched API is running');
    });
  });

  describe('Auth routes', () => {
    it('POST /auth/signup should return 400 for unsupported domain', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@gmail.com', name: 'Test', branch: 'CSE', year_of_study: 3 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('College email domain not supported');
    });

    it('POST /auth/signup should return 200 for valid signup', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'college-1' }] }) // college exists
        .mockResolvedValueOnce({ rows: [] }); // user not duplicate
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@juetguna.in', name: 'Test', branch: 'CSE', year_of_study: 3 });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('OTP sent to your college email');
      consoleSpy.mockRestore();
    });

    it('POST /auth/login should return 404 for unknown user', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'unknown@juetguna.in' });

      expect(res.status).toBe(404);
    });
  });

  describe('Protected routes', () => {
    let token;

    beforeEach(() => {
      token = 'valid-token';
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-1', role: 'SENIOR' });
    });

    it('GET /users/me should return 401 without token', async () => {
      const res = await request(app).get('/users/me');

      expect(res.status).toBe(401);
    });

    it('GET /users/me should return user profile with valid token', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: 'user-1', email: 'test@juetguna.in', name: 'Test', college_id: 'c1', branch: 'CSE', year_of_study: 3, role: 'SENIOR', credibility_score: 75 }]
      });

      const res = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 'user-1');
    });

    it('GET /tips should return feed with valid token', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .get('/tips')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('POST /tips should return 403 for FRESHER role', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-2', role: 'FRESHER' });

      const res = await request(app)
        .post('/tips')
        .set('Authorization', 'Bearer fresher-token')
        .send({ title: 'Test', body: 'Body that is long enough', category: 'EXAM', expiry_date: '2026-07-01', confidence_stake: 'MEDIUM' });

      expect(res.status).toBe(403);
    });

    it('POST /archive should return 403 for FRESHER role', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-2', role: 'FRESHER' });

      const res = await request(app)
        .post('/archive')
        .set('Authorization', 'Bearer fresher-token')
        .send({ body: 'This is a long enough body for submitting an archive entry.', category: 'ADMIN' });

      expect(res.status).toBe(403);
    });

    it('GET /disputes/queue should return 403 for SENIOR (not MODERATOR)', async () => {
      const res = await request(app)
        .get('/disputes/queue')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/nonexistent');

      expect(res.status).toBe(404);
    });

    it('should use global error handler for thrown errors', async () => {
      // Force a route to throw — health check endpoint itself won't throw,
      // but we can make a request that triggers middleware error
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-1', role: 'SENIOR' });
      mockPool.query.mockRejectedValue(new Error('Simulated DB crash'));

      const res = await request(app)
        .get('/users/me')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Simulated DB crash');
    });

    it('should use fallback message for errors without a message', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-1', role: 'SENIOR' });
      mockPool.query.mockRejectedValue({}); // error-like object with no message

      const res = await request(app)
        .get('/users/me')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Internal server error');
    });
  });
});
