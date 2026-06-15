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

const { submit, browse, getOne, vouch, getModQueue, moderate } = require('../../src/controllers/archive');

describe('Archive Controller', () => {
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
        body: 'Need to follow up 3-4 times with the admin office when submitting scholarship paperwork as they lose documents frequently.',
        category: 'ADMIN',
        branch: null,
      };
    });

    it('should return 400 if body is too short', async () => {
      req.body.body = 'Too short';

      await submit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Submission too short to be useful' });
    });

    it('should return 400 if body names individuals', async () => {
      req.body.body = 'Prof. Sharma is very helpful with admin paperwork in the college office, always responds to queries promptly.';

      await submit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Submissions must not name individuals' });
    });

    it('should reject text with "Dr" prefix', async () => {
      req.body.body = 'Dr. Verma always signs the clearance quickly, no issues with his approval process at all.';
      await submit(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject lowercase "prof" pattern', async () => {
      req.body.body = 'prof gupta is knowledgeable about the subject, very detailed lectures.';
      await submit(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should create archive entry with PENDING status', async () => {
      req.body.body = 'Need to follow up multiple times with admin office as they lose documents frequently during peak seasons like exam time.';
      mockPool.query.mockResolvedValue({ rows: [{ id: 'mock-uuid' }] });

      await submit(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO archive_entries"),
        expect.arrayContaining(['mock-uuid', 'user-1', null, 'ADMIN', expect.any(String)])
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'mock-uuid', message: 'Submitted for moderation' })
      );
    });
  });

  describe('browse', () => {
    it('should return live archive entries ordered by vouch_count', async () => {
      const entries = [
        { id: 'e1', body: 'Entry 1', vouch_count: 10 },
        { id: 'e2', body: 'Entry 2', vouch_count: 5 },
      ];
      mockPool.query.mockResolvedValue({ rows: entries });

      await browse(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('vouch_count DESC'),
        ['user-1', null]
      );
      expect(res.json).toHaveBeenCalledWith(entries);
    });

    it('should filter by category if provided', async () => {
      req.query.category = 'ADMIN';
      mockPool.query.mockResolvedValue({ rows: [] });

      await browse(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user-1', 'ADMIN']
      );
    });
  });

  describe('getOne', () => {
    it('should return an archive entry by id', async () => {
      req.params.id = 'entry-1';
      const entry = { id: 'entry-1', body: 'Some entry', status: 'LIVE' };
      mockPool.query.mockResolvedValue({ rows: [entry] });

      await getOne(req, res, next);

      expect(res.json).toHaveBeenCalledWith(entry);
    });

    it('should return 404 if entry not found', async () => {
      req.params.id = 'nonexistent';
      mockPool.query.mockResolvedValue({ rows: [] });

      await getOne(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Entry not found' });
    });
  });

  describe('vouch', () => {
    beforeEach(() => {
      req.params.id = 'entry-1';
    });

    it('should return 409 if already vouched', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 'existing-vouch' }] });

      await vouch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Already vouched' });
    });

    it('should insert vouch and increment count', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // no existing vouch
        .mockResolvedValueOnce({ rows: [] }) // INSERT vouch
        .mockResolvedValueOnce({ rows: [] }); // UPDATE count

      await vouch(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: 'Vouched and expiry reset' });
    });
  });

  describe('getModQueue', () => {
    it('should return PENDING archive entries for user college', async () => {
      const pending = [{ id: 'e1', body: 'Pending entry', status: 'PENDING' }];
      mockPool.query.mockResolvedValue({ rows: pending });

      await getModQueue(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("ae.status='PENDING'"),
        ['user-1']
      );
      expect(res.json).toHaveBeenCalledWith(pending);
    });
  });

  describe('moderate', () => {
    beforeEach(() => {
      req.params.id = 'entry-1';
    });

    it('should APPROVE and set status to LIVE', async () => {
      req.body = { decision: 'APPROVE' };
      mockPool.query.mockResolvedValue({ rows: [] });

      await moderate(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE archive_entries SET status'),
        ['LIVE', 'entry-1']
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Entry live' });
    });

    it('should REJECT and set status to REJECTED', async () => {
      req.body = { decision: 'REJECT' };
      mockPool.query.mockResolvedValue({ rows: [] });

      await moderate(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['REJECTED', 'entry-1']
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Entry rejected' });
    });
  });
});
