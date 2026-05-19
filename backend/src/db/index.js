const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const connectDB = async () => {
  await pool.connect();
  console.log('PostgreSQL connected');
};

module.exports = { pool, connectDB };
