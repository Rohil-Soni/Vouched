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

const { file, getOne, getQueue, vote } = require('../../src/controllers/disputes');

describe('Disputes Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { id: 'mod-1', role: 'MODERATOR' }, body: {}, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    mockPool.query.mockReset();
  });

  describe('file', () => {
    beforeEach(() => {
      req.body = {
        tip_id: 'tip-1',
        q1_what_wrong: 'This tip is incorrect',
        q2_acted_on_tip: true,
        q3_actual_outcome: 'Different experience',
        q4_when_happened: '2026-05-01',
        q5_evidence: 'Screenshot attached',
      };
    });

    it('should return 400 if user has not acted on the tip', async () => {
      req.body.q2_acted_on_tip = false;

      await file(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You must have personally acted on the tip to dispute it'
      });
    });

    it('should create dispute and set tip to DISPUTED', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'mock-uuid', tip_id: 'tip-1', status: 'OPEN' }] }) // INSERT dispute
        .mockResolvedValueOnce({ rows: [] }); // UPDATE tip status

      await file(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tips SET status='DISPUTED'"),
        ['tip-1']
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle missing evidence', async () => {
      delete req.body.q5_evidence;
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'mock-uuid' }] })
        .mockResolvedValueOnce({ rows: [] });

      await file(req, res, next);

      // Should pass null for evidence
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getOne', () => {
    it('should return a dispute by id', async () => {
      req.params.id = 'dispute-1';
      const fakeDispute = { id: 'dispute-1', tip_id: 'tip-1', status: 'OPEN' };
      mockPool.query.mockResolvedValue({ rows: [fakeDispute] });

      await getOne(req, res, next);

      expect(res.json).toHaveBeenCalledWith(fakeDispute);
    });

    it('should return 404 if dispute not found', async () => {
      req.params.id = 'nonexistent';
      mockPool.query.mockResolvedValue({ rows: [] });

      await getOne(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Dispute not found' });
    });
  });

  describe('getQueue', () => {
    it('should return open disputes for user college', async () => {
      const disputes = [
        { id: 'd1', tip_id: 't1', status: 'OPEN' },
        { id: 'd2', tip_id: 't2', status: 'OPEN' },
      ];
      mockPool.query.mockResolvedValue({ rows: disputes });

      await getQueue(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("d.status = 'OPEN'"),
        ['mod-1']
      );
      expect(res.json).toHaveBeenCalledWith(disputes);
    });
  });

  describe('vote', () => {
    beforeEach(() => {
      req.params.id = 'dispute-1';
      req.body = { vote: 'UPHOLD' };
    });

    it('should return 404 if dispute not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await vote(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Dispute not found' });
    });

    it('should record a vote and return confirmation before 3 votes', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'dispute-1', tip_id: 'tip-1' }] }) // SELECT dispute
        .mockResolvedValueOnce({ rows: [] }) // INSERT vote
        .mockResolvedValueOnce({ rows: [{ count: 1, upholds: 1 }] }) // COUNT votes (only 1)
        .mockResolvedValueOnce({ rows: [{ id: 'tip-1', author_id: 'author-1', confidence_stake: 'MEDIUM' }] }); // SELECT tip (unused since <3)

      await vote(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: 'Vote recorded' });
    });

    it('should resolve dispute UPHOLD if >= 2 of 3 votes UPHOLD', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'dispute-1', tip_id: 'tip-1', reporter_id: 'reporter-1' }] }) // SELECT dispute
        .mockResolvedValueOnce({ rows: [] }) // INSERT vote
        .mockResolvedValueOnce({ rows: [{ vote: 'UPHOLD' }, { vote: 'UPHOLD' }, { vote: 'UPHOLD' }] }) // 3 votes total
        .mockResolvedValueOnce({ rows: [{ id: 'tip-1', author_id: 'author-1', cosigner_id: 'cosigner-1', confidence_stake: 'HIGH' }] }) // SELECT tip
        .mockResolvedValueOnce({ rows: [] }) // UPDATE tips status='REMOVED'
        .mockResolvedValueOnce({ rows: [] }) // UPDATE disputes status='UPHELD'
        .mockResolvedValueOnce({ rows: [] }) // UPDATE author credibility (HIGH=25 loss)
        .mockResolvedValueOnce({ rows: [] }) // UPDATE cosigner credibility (-5)
        .mockResolvedValueOnce({ rows: [] }); // INSERT credibility event

      await vote(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: 'Dispute resolved' });
    });

    it('should resolve dispute REJECTED if < 2 of 3 votes UPHOLD', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'dispute-1', tip_id: 'tip-1', reporter_id: 'reporter-1' }] }) // SELECT dispute
        .mockResolvedValueOnce({ rows: [] }) // INSERT vote
        .mockResolvedValueOnce({ rows: [{ vote: 'REJECT' }, { vote: 'REJECT' }, { vote: 'UPHOLD' }] }) // 3 votes, 1 uphold
        .mockResolvedValueOnce({ rows: [{ id: 'tip-1', author_id: 'author-1', confidence_stake: 'LOW' }] }) // SELECT tip
        .mockResolvedValueOnce({ rows: [] }) // UPDATE tips status='LIVE'
        .mockResolvedValueOnce({ rows: [] }) // UPDATE disputes status='REJECTED'
        .mockResolvedValueOnce({ rows: [] }) // UPDATE reporter credibility (-5)
        .mockResolvedValueOnce({ rows: [] }); // INSERT credibility event

      await vote(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: 'Dispute resolved' });
    });

    it('should use correct credibility loss amounts per stake', async () => {
      const testCases = [
        { stake: 'LOW', expectedLoss: 10 },
        { stake: 'MEDIUM', expectedLoss: 17 },
        { stake: 'HIGH', expectedLoss: 25 },
      ];

      for (const { stake, expectedLoss } of testCases) {
        mockPool.query.mockReset();
        mockPool.query
          .mockResolvedValueOnce({ rows: [{ id: 'dispute-1', tip_id: 'tip-1', reporter_id: 'r-1' }] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [{ vote: 'UPHOLD' }, { vote: 'UPHOLD' }, { vote: 'UPHOLD' }] }) // 3 rows
          .mockResolvedValueOnce({ rows: [{ id: 'tip-1', author_id: 'a-1', cosigner_id: 'c-1', confidence_stake: stake }] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [] });

        await vote(req, res, next);

        // Check that the author credibility update uses the correct loss
        // SQL: UPDATE users SET credibility_score=GREATEST(0,credibility_score-25) WHERE id=$1
        const updateAuthorCall = mockPool.query.mock.calls.find(c => c[0].includes('credibility_score=GREATEST'));
        expect(updateAuthorCall).toBeTruthy();
        expect(updateAuthorCall[1]).toContain(expectedLoss);
      }
    });
  });
});
