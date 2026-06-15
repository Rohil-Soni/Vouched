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

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const app = require('../../src/app');

describe('Moderator Routes', () => {
  let modToken, adminToken;

  beforeEach(() => {
    mockPool.query.mockReset();
    jest.restoreAllMocks();
    modToken = 'mod-token';
    adminToken = 'admin-token';
  });

  describe('GET /moderator/disputes', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/moderator/disputes');
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-MODERATOR role', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-1', role: 'SENIOR' });

      const res = await request(app)
        .get('/moderator/disputes')
        .set('Authorization', 'Bearer senior-token');

      expect(res.status).toBe(403);
    });

    it('should return 403 if moderator credibility < 75', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'mod-1', role: 'MODERATOR' });
      mockPool.query.mockResolvedValue({ rows: [{ credibility_score: 50 }] });

      const res = await request(app)
        .get('/moderator/disputes')
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Insufficient credibility to moderate');
    });

    it('should return disputes list for valid moderator', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'mod-1', role: 'MODERATOR' });
      const mockDisputes = [
        { id: 'd-1', status: 'OPEN', tip_title: 'Bad prof' }
      ];
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ credibility_score: 85 }] })
        .mockResolvedValueOnce({ rows: mockDisputes });

      const res = await request(app)
        .get('/moderator/disputes')
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockDisputes);
    });

    it('should use query parameter status if provided', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'mod-1', role: 'MODERATOR' });
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ credibility_score: 80 }] })
        .mockResolvedValueOnce({ rows: [] });

      await request(app)
        .get('/moderator/disputes?status=RESOLVED')
        .set('Authorization', `Bearer ${modToken}`);

      // The second query should filter by the status param
      expect(mockPool.query.mock.calls[1][0]).toContain('d.status = $1');
      expect(mockPool.query.mock.calls[1][1]).toEqual(['RESOLVED']);
    });

    it('should allow ADMIN role', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'admin-1', role: 'ADMIN' });
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ credibility_score: 100 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'd-1' }] });

      const res = await request(app)
        .get('/moderator/disputes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should pass errors to error handler', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'mod-1', role: 'MODERATOR' });
      mockPool.query.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .get('/moderator/disputes')
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(500);
    });
  });

  describe('POST /moderator/disputes/:id/vote', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).post('/moderator/disputes/d-1/vote');
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-MODERATOR role', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-1', role: 'SENIOR' });

      const res = await request(app)
        .post('/moderator/disputes/d-1/vote')
        .set('Authorization', 'Bearer senior-token');

      expect(res.status).toBe(403);
    });

    it('should return 400 if vote is not UPHOLD or REJECT', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'mod-1', role: 'MODERATOR' });
      mockPool.query.mockResolvedValue({ rows: [{ credibility_score: 80 }] });

      const res = await request(app)
        .post('/moderator/disputes/d-1/vote')
        .set('Authorization', `Bearer ${modToken}`)
        .send({ vote: 'INVALID' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Vote must be UPHOLD or REJECT');
    });

    it('should return 403 if moderator credibility < 75', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'mod-1', role: 'MODERATOR' });
      mockPool.query.mockResolvedValue({ rows: [{ credibility_score: 60 }] });

      const res = await request(app)
        .post('/moderator/disputes/d-1/vote')
        .set('Authorization', `Bearer ${modToken}`)
        .send({ vote: 'UPHOLD' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Insufficient credibility to moderate');
    });

    it('should return 404 if dispute not found', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'mod-1', role: 'MODERATOR' });
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ credibility_score: 80 }] })
        .mockResolvedValueOnce({ rows: [] }); // dispute not found

      const res = await request(app)
        .post('/moderator/disputes/nonexistent/vote')
        .set('Authorization', `Bearer ${modToken}`)
        .send({ vote: 'UPHOLD' });

      expect(res.status).toBe(404);
    });

    it('should record vote and return confirmation before 3 votes', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'mod-1', role: 'MODERATOR' });
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ credibility_score: 80 }] }) // credibility check
        .mockResolvedValueOnce({ rows: [{ id: 'd-1', tip_id: 't-1', reporter_id: 'r-1' }] }) // dispute data
        .mockResolvedValueOnce({ rows: [] }) // INSERT vote
        .mockResolvedValueOnce({ rows: [{ count: 1, upholds: 1 }] }); // only 1 vote so far

      const res = await request(app)
        .post('/moderator/disputes/d-1/vote')
        .set('Authorization', `Bearer ${modToken}`)
        .send({ vote: 'UPHOLD' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Vote recorded');
      expect(res.body.resolved).toBe(false);
    });

    it('should resolve dispute UPHELD when >= 2 of 3 votes UPHOLD', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'mod-1', role: 'MODERATOR' });
      // 9 queries: 1 credibility + 1 dispute data + 1 insert + 1 count
      // + 1 update disputes + 1 update author cred + 1 update reporter cred
      // + 1 select author + 1 insert credibility event
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ credibility_score: 80 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'd-1', tip_id: 't-1', reporter_id: 'r-1' }] })
        .mockResolvedValueOnce({ rows: [] }) // INSERT vote
        .mockResolvedValueOnce({ rows: [{ count: 3, upholds: 2 }] }) // 3 votes, 2 upholds = UPHELD
        .mockResolvedValueOnce({ rows: [] }) // UPDATE disputes status='UPHELD'
        .mockResolvedValueOnce({ rows: [] }) // UPDATE author credibility -25
        .mockResolvedValueOnce({ rows: [] }) // UPDATE reporter credibility +15
        .mockResolvedValueOnce({ rows: [{ author_id: 'a-1' }] }) // SELECT tip author
        .mockResolvedValueOnce({ rows: [] }); // INSERT credibility event

      const res = await request(app)
        .post('/moderator/disputes/d-1/vote')
        .set('Authorization', `Bearer ${modToken}`)
        .send({ vote: 'UPHOLD' });

      expect(res.status).toBe(200);
      expect(res.body.resolved).toBe(true);
    });

    it('should resolve dispute REJECTED when < 2 of 3 votes UPHOLD', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'mod-1', role: 'MODERATOR' });
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ credibility_score: 80 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'd-1', tip_id: 't-1', reporter_id: 'r-1' }] })
        .mockResolvedValueOnce({ rows: [] }) // INSERT vote
        .mockResolvedValueOnce({ rows: [{ count: 3, upholds: 1 }] }) // 3 votes, 1 uphold = REJECTED
        .mockResolvedValueOnce({ rows: [] }) // UPDATE disputes status='REJECTED'
        .mockResolvedValueOnce({ rows: [] }) // UPDATE reporter credibility -20
        .mockResolvedValueOnce({ rows: [] }) // UPDATE author credibility +10
        .mockResolvedValueOnce({ rows: [{ author_id: 'a-1' }] }) // SELECT tip author
        .mockResolvedValueOnce({ rows: [] }); // INSERT credibility event

      const res = await request(app)
        .post('/moderator/disputes/d-1/vote')
        .set('Authorization', `Bearer ${modToken}`)
        .send({ vote: 'REJECT' });

      expect(res.status).toBe(200);
      expect(res.body.resolved).toBe(true);
    });

    it('should handle missing tip author gracefully', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'mod-1', role: 'MODERATOR' });

      // UPHELD branch — tip author select returns no rows
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ credibility_score: 80 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'd-1', tip_id: 't-1', reporter_id: 'r-1' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: 3, upholds: 2 }] })
        .mockResolvedValueOnce({ rows: [] }) // UPDATE disputes
        .mockResolvedValueOnce({ rows: [] }) // UPDATE author cred
        .mockResolvedValueOnce({ rows: [] }) // UPDATE reporter cred
        .mockResolvedValueOnce({ rows: [] }); // SELECT tip author — empty

      const res = await request(app)
        .post('/moderator/disputes/d-1/vote')
        .set('Authorization', `Bearer ${modToken}`)
        .send({ vote: 'UPHOLD' });

      expect(res.status).toBe(200);
      expect(res.body.resolved).toBe(true);
    });

    it('should use correct credibility delta values for UPHELD', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'mod-1', role: 'MODERATOR' });
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ credibility_score: 80 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'd-1', tip_id: 't-1', reporter_id: 'r-1' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: 3, upholds: 2 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }) // UPDATE author -25
        .mockResolvedValueOnce({ rows: [] }) // UPDATE reporter +15
        .mockResolvedValueOnce({ rows: [{ author_id: 'a-1' }] })
        .mockResolvedValueOnce({ rows: [] }); // INSERT cred event with delta=-25

      await request(app)
        .post('/moderator/disputes/d-1/vote')
        .set('Authorization', `Bearer ${modToken}`)
        .send({ vote: 'UPHOLD' });

      // Author credibility update: -25
      const authorUpdate = mockPool.query.mock.calls.find(
        c => c[0].includes('credibility_score') && c[0].includes('GREATEST')
      );
      expect(authorUpdate).toBeTruthy();
      expect(authorUpdate[0]).toContain('- 25');

      // Reporter credibility update: +15
      const reporterUpdate = mockPool.query.mock.calls.find(
        c => c[0].includes('credibility_score') && c[0].includes('LEAST')
      );
      expect(reporterUpdate).toBeTruthy();
      expect(reporterUpdate[0]).toContain('+ 15');
    });
  });
});
