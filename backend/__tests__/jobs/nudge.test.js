jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-nudge-id') }));
jest.mock('node-cron', () => ({ schedule: jest.fn() }));

const { Pool } = require('pg');
const mockPool = new Pool();
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

describe('Nudge Job', () => {
  beforeEach(() => {
    mockPool.query.mockReset();
  });

  it('should schedule a daily cron task on require', () => {
    // Re-require to trigger cron.schedule
    jest.isolateModules(() => {
      require('../../src/jobs/nudge');
    });

    expect(cron.schedule).toHaveBeenCalledWith('0 8 * * *', expect.any(Function));
  });

  describe('runNudgeEngine', () => {
    let runNudgeEngine;

    beforeAll(() => {
      jest.isolateModules(() => {
        runNudgeEngine = require('../../src/jobs/nudge').runNudgeEngine;
      });
    });

    it('should create nudges for tips at threshold days', async () => {
      const futureDate = (daysFromNow) => {
        const d = new Date();
        d.setDate(d.getDate() + daysFromNow);
        return d.toISOString();
      };

      const liveTips = [
        { id: 'tip-1', college_id: 'c1', branch_scope: ['CSE'], expiry_date: futureDate(3) },  // 3 days = threshold
        { id: 'tip-2', college_id: 'c1', branch_scope: null, expiry_date: futureDate(7) },    // 7 days = threshold
        { id: 'tip-3', college_id: 'c1', branch_scope: ['ECE'], expiry_date: futureDate(21) }, // 21 days = threshold
        { id: 'tip-4', college_id: 'c1', branch_scope: null, expiry_date: futureDate(10) },   // no threshold match
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: liveTips }) // SELECT LIVE tips
        .mockResolvedValueOnce({ rows: [{ id: 'u1' }, { id: 'u2' }] }) // users for tip-1 (CSE)
        .mockResolvedValueOnce({ rows: [] }) // INSERT nudge u1/tip-1
        .mockResolvedValueOnce({ rows: [] }) // INSERT nudge u2/tip-1
        .mockResolvedValueOnce({ rows: [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }] }) // users for tip-2 (all branches)
        .mockResolvedValueOnce({ rows: [] }) // INSERT nudge u1/tip-2/7
        .mockResolvedValueOnce({ rows: [] }) // INSERT nudge u2/tip-2/7
        .mockResolvedValueOnce({ rows: [] }) // INSERT nudge u3/tip-2/7
        .mockResolvedValueOnce({ rows: [{ id: 'u1' }] }) // users for tip-3 (ECE)
        .mockResolvedValueOnce({ rows: [] }) // INSERT nudge u1/tip-3/21
        .mockResolvedValueOnce({ rows: [] }); // UPDATE expired tips

      await runNudgeEngine();

      // Should have created 2+3+1 = 6 nudges, plus 1 UPDATE for expiry
      expect(mockPool.query.mock.calls.length).toBeGreaterThanOrEqual(7);
    });

    it('should expire tips past their expiry date', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // no LIVE tips
        .mockResolvedValueOnce({ rows: [] }); // UPDATE expired

      await runNudgeEngine();

      // Last query should be the expiry update
      const lastCall = mockPool.query.mock.calls[mockPool.query.mock.calls.length - 1];
      expect(lastCall[0]).toContain("status='EXPIRED'");
      expect(lastCall[0]).toContain("expiry_date < NOW()");
    });

    it('should handle errors gracefully without crashing', async () => {
      mockPool.query.mockRejectedValue(new Error('DB error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await runNudgeEngine();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Nudge engine error:',
        'DB error'
      );
      consoleSpy.mockRestore();
    });
  });
});
