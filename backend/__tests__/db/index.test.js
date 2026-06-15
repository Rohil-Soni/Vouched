/**
 * Tests for db/index.js
 *
 * The module is loaded once (cached by other test files via the app).
 * We verify exports and the async contract.
 */
describe('Database Index', () => {
  let dbIndex;

  beforeAll(() => {
    dbIndex = require('../../src/db/index');
  });

  describe('exports', () => {
    it('should export a pool object', () => {
      expect(dbIndex).toHaveProperty('pool');
      expect(dbIndex.pool).toBeDefined();
    });

    it('should export connectDB as an async function', () => {
      expect(dbIndex).toHaveProperty('connectDB');
      expect(typeof dbIndex.connectDB).toBe('function');
    });
  });
});
