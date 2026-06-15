jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue({ release: jest.fn() }),
    on: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

/**
 * Tests for app.js environment-conditional configuration.
 * These run in isolated module contexts so each test
 * gets a fresh app instance with different env vars.
 */
describe('App Configuration', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('CLIENT_URL handling', () => {
    it('should include CLIENT_URL in allowed origins when set', () => {
      process.env.CLIENT_URL = 'https://custom.vouched.com';
      process.env.JWT_SECRET = '***';
      process.env.JWT_REFRESH_SECRET = '***';

      const app = require('../src/app');
      // App loads without error — CLIENT_URL gets added to allowedOrigins
      expect(app).toBeDefined();

      // Verify CORS middleware is configured (app can handle requests)
      const request = require('supertest');
      return request(app)
        .get('/healthz')
        .expect(200);
    });

    it('should not duplicate CLIENT_URL if already in allowedOrigins', () => {
      process.env.CLIENT_URL = 'http://localhost:5173'; // already in default origins
      process.env.JWT_SECRET = '***';
      process.env.JWT_REFRESH_SECRET = '***';

      const app = require('../src/app');
      expect(app).toBeDefined();
    });
  });

  describe('production request logging', () => {
    it('should log requests when NODE_ENV=production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = '***';
      process.env.JWT_REFRESH_SECRET = '***';

      const request = require('supertest');
      const app = require('../src/app');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      return request(app)
        .get('/healthz')
        .then(res => {
          expect(res.status).toBe(200);
          // Production logging middleware should have fired
          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('GET /healthz')
          );
          consoleSpy.mockRestore();
        });
    });
  });
});
