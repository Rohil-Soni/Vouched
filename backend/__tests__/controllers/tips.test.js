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

const { Pool } = require('pg');
const mockPool = new Pool();

const { submit, getFeed, getOne, cosign, confirm } = require('../../src/controllers/tips');

describe('Tips Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { id: 'user-1', role: 'SENIOR' }, body: {}, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    mockPool.query.mockReset();
  });

  describe('submit', () => {
    beforeEach(() => {
      req.body = {
        title: 'Test tip',
        body: 'This is a test tip body',
        category: 'EXAM',
        expiry_date: '2026-07-01',
        confidence_stake: 'MEDIUM',
        branch_scope: ['CSE'],
      };
    });

    it('should create a tip with PENDING_COSIGN status', async () => {
      const fakeTip = { id: 'mock-uuid', author_id: 'user-1', status: 'PENDING_COSIGN' };
      mockPool.query.mockResolvedValue({ rows: [fakeTip] });

      await submit(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tips'),
        ['mock-uuid', 'user-1', 'Test tip', 'This is a test tip body', 'EXAM', '2026-07-01', 'MEDIUM', ['CSE']]
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeTip);
    });
  });

  describe('getFeed', () => {
    it('should return live tips ordered by feed_score', async () => {
      const tips = [
        { id: 't1', title: 'Tip A', feed_score: 2.5 },
        { id: 't2', title: 'Tip B', feed_score: 1.2 },
      ];
      mockPool.query.mockResolvedValue({ rows: tips });

      await getFeed(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('feed_score DESC'),
        ['user-1', null]
      );
      expect(res.json).toHaveBeenCalledWith(tips);
    });

    it('should filter by branch if provided', async () => {
      req.query.branch = 'CSE';
      mockPool.query.mockResolvedValue({ rows: [] });

      await getFeed(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user-1', 'CSE']
      );
    });
  });

  describe('getOne', () => {
    it('should return a tip by id', async () => {
      req.params.id = 'tip-1';
      const fakeTip = { id: 'tip-1', title: 'Test', author_name: 'Author', author_credibility: 80 };
      mockPool.query.mockResolvedValue({ rows: [fakeTip] });

      await getOne(req, res, next);

      expect(res.json).toHaveBeenCalledWith(fakeTip);
    });

    it('should return 404 if tip not found', async () => {
      req.params.id = 'nonexistent';
      mockPool.query.mockResolvedValue({ rows: [] });

      await getOne(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Tip not found' });
    });
  });

  describe('cosign', () => {
    beforeEach(() => {
      req.params.id = 'tip-1';
    });

    it('should return 404 if tip not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await cosign(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Tip not found' });
    });

    it('should return 400 if tip is not PENDING_COSIGN', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 'tip-1', status: 'LIVE', author_id: 'other' }] });

      await cosign(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Tip not awaiting cosign' });
    });

    it('should return 400 if user tries to cosign their own tip', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 'tip-1', status: 'PENDING_COSIGN', author_id: 'user-1' }] });

      await cosign(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cannot cosign your own tip' });
    });

    it('should set tip to LIVE with feed_score on valid cosign', async () => {
      const tip = { id: 'tip-1', status: 'PENDING_COSIGN', author_id: 'other-user', category: 'EXAM', expiry_date: '2026-07-01', confidence_stake: 'MEDIUM', branch_scope: [] };
      mockPool.query
        .mockResolvedValueOnce({ rows: [tip] }) // SELECT tip
        .mockResolvedValueOnce({ rows: [{ credibility_score: 85 }] }) // SELECT author cred
        .mockResolvedValueOnce({ rows: [] }); // UPDATE

      await cosign(req, res, next);

      // Should have called UPDATE to set LIVE
      expect(mockPool.query.mock.calls[2][0]).toContain('UPDATE tips SET');
      expect(mockPool.query.mock.calls[2][1]).toContain('user-1'); // cosigner_id
      expect(res.json).toHaveBeenCalledWith({ message: 'Tip is now live' });
    });
  });

  describe('confirm', () => {
    beforeEach(() => {
      req.params.id = 'tip-1';
    });

    it('should return 404 if tip not found or not expired', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await confirm(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Tip not found or not expired yet' });
    });

    it('should update credibility and log event on valid confirm', async () => {
      const expiredTip = { id: 'tip-1', author_id: 'author-1', status: 'EXPIRED', confidence_stake: 'HIGH' };
      mockPool.query
        .mockResolvedValueOnce({ rows: [expiredTip] }) // SELECT expired tip
        .mockResolvedValueOnce({ rows: [] }) // UPDATE credibility
        .mockResolvedValueOnce({ rows: [] }); // INSERT event

      await confirm(req, res, next);

      // HIGH stake = +15 credibility
      expect(mockPool.query.mock.calls[1][1]).toContain(15);
      expect(res.json).toHaveBeenCalledWith({ message: 'Tip confirmed as accurate' });
    });

    it('should grant correct deltas based on confidence stake', async () => {
      const tip = { id: 'tip-1', author_id: 'author-1', status: 'EXPIRED' };

      for (const { stake, expectedDelta } of [{ stake: 'LOW', expectedDelta: 5 }, { stake: 'MEDIUM', expectedDelta: 10 }, { stake: 'HIGH', expectedDelta: 15 }]) {
        mockPool.query.mockReset();
        mockPool.query
          .mockResolvedValueOnce({ rows: [{ ...tip, confidence_stake: stake }] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [] });

        await confirm(req, res, next);

        expect(mockPool.query.mock.calls[1][1]).toContain(expectedDelta);
      }
    });
  });
});
