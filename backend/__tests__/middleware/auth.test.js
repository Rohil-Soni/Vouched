const jwt = require('jsonwebtoken');
const { authenticate, requireRole } = require('../../src/middleware/auth');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('authenticate', () => {
    it('should return 401 if no token provided', () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if Authorization header has no token', () => {
      req.headers.authorization = 'Bearer ';
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      req.headers.authorization = 'Bearer invalid-token';
      jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('jwt malformed'); });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with decoded user if token is valid', () => {
      req.headers.authorization = 'Bearer valid-token';
      const decoded = { id: 'user-1', role: 'SENIOR' };
      jest.spyOn(jwt, 'verify').mockReturnValue(decoded);

      authenticate(req, res, next);

      expect(req.user).toEqual(decoded);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should return 403 if user role is not in allowed roles', () => {
      req.user = { id: 'user-1', role: 'FRESHER' };
      const middleware = requireRole('SENIOR', 'MODERATOR');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user role is in allowed roles', () => {
      req.user = { id: 'user-1', role: 'SENIOR' };
      const middleware = requireRole('SENIOR', 'MODERATOR');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow MODERATOR role for moderator routes', () => {
      req.user = { id: 'user-1', role: 'MODERATOR' };
      const middleware = requireRole('MODERATOR', 'ADMIN');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
