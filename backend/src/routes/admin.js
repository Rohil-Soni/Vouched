const router = require('express').Router();
const { ensureAdminAccess } = require('../middleware/auth');
const { pool } = require('../db');

// Admin-only routes
router.use(ensureAdminAccess);

// Switch role for any user
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['FRESHER', 'SENIOR', 'MODERATOR', 'ADMIN'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });

    const { rows } = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
      [role, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// List all users (for monitoring)
router.get('/users', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, year_of_study, credibility_score FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// Get a single user by ID
router.get('/users/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, year_of_study, credibility_score FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// List all tips (including pending)
router.get('/tips', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT t.*, u.name as author_name, u.email as author_email FROM tips t JOIN users u ON t.author_id = u.id ORDER BY t.created_at DESC'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// Update tip status (approve/reject)
router.patch('/tips/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['PENDING_COSIGN', 'LIVE', 'REJECTED', 'EXPIRED'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const { rows } = await pool.query(
      'UPDATE tips SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
