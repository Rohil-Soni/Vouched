const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Prevent crash on DB disconnects (e.g. Neon idle timeout)
pool.on('error', (err) => {
  console.error('Unexpected DB error — pool will auto-recover:', err.message);
});

const connectDB = async () => {
  const client = await pool.connect();
  await client.query('SELECT 1');
  client.release();
  console.log('PostgreSQL connected');
};

module.exports = { pool, connectDB };
