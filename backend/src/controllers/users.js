const { pool } = require('../db');

const getMe = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, college_id, branch, year_of_study, role, credibility_score FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const updateMe = async (req, res, next) => {
  try {
    const { branch, year_of_study } = req.body;
    await pool.query('UPDATE users SET branch=$1, year_of_study=$2 WHERE id=$3', [branch, year_of_study, req.user.id]);
    res.json({ message: 'Profile updated' });
  } catch (err) { next(err); }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, role, credibility_score FROM users WHERE id=$1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const getCredibilityHistory = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT delta, reason, reference_id, created_at FROM credibility_events WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = { getMe, updateMe, getPublicProfile, getCredibilityHistory };
