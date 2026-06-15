jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const { Pool } = require('pg');
const mockPool = new Pool();

const { getMe, updateMe, getPublicProfile, getCredibilityHistory } = require('../../src/controllers/users');

describe('Users Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { id: 'user-1' }, body: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    mockPool.query.mockReset();
  });

  describe('getMe', () => {
    it('should return the authenticated user profile', async () => {
      const fakeUser = { id: 'user-1', email: 'test@juetguna.in', name: 'Test', college_id: 'c1', branch: 'CSE', year_of_study: 3, role: 'SENIOR', credibility_score: 75 };
      mockPool.query.mockResolvedValue({ rows: [fakeUser] });

      await getMe(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), ['user-1']);
      expect(res.json).toHaveBeenCalledWith(fakeUser);
    });

    it('should pass errors to next()', async () => {
      mockPool.query.mockRejectedValue(new Error('DB error'));

      await getMe(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateMe', () => {
    it('should update branch and year_of_study', async () => {
      req.body = { branch: 'ECE', year_of_study: 4 };
      mockPool.query.mockResolvedValue({ rows: [] });

      await updateMe(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        ['ECE', 4, 'user-1']
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Profile updated' });
    });
  });

  describe('getPublicProfile', () => {
    it('should return user public profile by id', async () => {
      req.params.id = 'user-2';
      const fakeProfile = { id: 'user-2', name: 'Other', role: 'FRESHER', credibility_score: 50 };
      mockPool.query.mockResolvedValue({ rows: [fakeProfile] });

      await getPublicProfile(req, res, next);

      expect(res.json).toHaveBeenCalledWith(fakeProfile);
    });

    it('should return 404 if user not found', async () => {
      req.params.id = 'nonexistent';
      mockPool.query.mockResolvedValue({ rows: [] });

      await getPublicProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });

  describe('getCredibilityHistory', () => {
    it('should return credibility events for the authenticated user', async () => {
      const events = [
        { delta: 15, reason: 'Tip confirmed', reference_id: 'tip-1', created_at: new Date() },
        { delta: -5, reason: 'Dispute upheld', reference_id: null, created_at: new Date() },
      ];
      mockPool.query.mockResolvedValue({ rows: events });

      await getCredibilityHistory(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('credibility_events'),
        ['user-1']
      );
      expect(res.json).toHaveBeenCalledWith(events);
    });
  });
});
