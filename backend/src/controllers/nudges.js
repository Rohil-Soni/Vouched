const { pool } = require('../db');

const getMyNudges = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM nudges WHERE user_id=$1 ORDER BY sent_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const markOpened = async (req, res, next) => {
  try {
    await pool.query('UPDATE nudges SET opened_at=NOW() WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Marked as opened' });
  } catch (err) { next(err); }
};

module.exports = { getMyNudges, markOpened };
