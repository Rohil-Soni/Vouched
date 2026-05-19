const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');

const THRESHOLDS = [21, 7, 3];

const runNudgeEngine = async () => {
  try {
    const { rows: tips } = await pool.query(`SELECT * FROM tips WHERE status='LIVE'`);

    for (const tip of tips) {
      const daysLeft = Math.ceil((new Date(tip.expiry_date) - Date.now()) / 86400000);
      const threshold = THRESHOLDS.find(t => daysLeft === t);
      if (!threshold) continue;

      const { rows: users } = await pool.query(
        `SELECT u.id FROM users u
         WHERE u.college_id = $1
           AND (array_length($2::text[], 1) IS NULL OR u.branch = ANY($2::text[]))
           AND NOT EXISTS (
             SELECT 1 FROM nudges n WHERE n.user_id=u.id AND n.tip_id=$3 AND n.threshold_days=$4
           )`,
        [tip.college_id, tip.branch_scope, tip.id, threshold]
      );

      for (const user of users) {
        await pool.query(
          `INSERT INTO nudges (id, user_id, tip_id, threshold_days, channel) VALUES ($1,$2,$3,$4,'in_app')`,
          [uuidv4(), user.id, tip.id, threshold]
        );
      }
    }

    // Expire tips past their expiry date
    await pool.query(`UPDATE tips SET status='EXPIRED' WHERE status='LIVE' AND expiry_date < NOW()`);
  } catch (err) {
    console.error('Nudge engine error:', err.message);
  }
};

// Run daily at 8:00 AM
cron.schedule('0 8 * * *', runNudgeEngine);

module.exports = { runNudgeEngine };
