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

const { getMyNudges, markOpened } = require('../../src/controllers/nudges');

describe('Nudges Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { id: 'user-1' }, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    mockPool.query.mockReset();
  });

  describe('getMyNudges', () => {
    it('should return nudges ordered by sent_at DESC', async () => {
      const nudges = [
        { id: 'n1', tip_id: 't1', sent_at: new Date('2026-06-14') },
        { id: 'n2', tip_id: 't2', sent_at: new Date('2026-06-13') },
      ];
      mockPool.query.mockResolvedValue({ rows: nudges });

      await getMyNudges(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY sent_at DESC'),
        ['user-1']
      );
      expect(res.json).toHaveBeenCalledWith(nudges);
    });
  });

  describe('markOpened', () => {
    it('should update opened_at for the nudge', async () => {
      req.params.id = 'nudge-1';
      mockPool.query.mockResolvedValue({ rows: [] });

      await markOpened(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE nudges SET opened_at=NOW()'),
        ['nudge-1', 'user-1']
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Marked as opened' });
    });
  });
});
