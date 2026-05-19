const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');

const URGENCY_WEIGHTS = { SCHOLARSHIP: 1.5, EXAM: 1.4, PLACEMENT: 1.3, FACULTY: 1.1, CLUB: 1.0, ADMIN: 0.9 };

const daysRemainingFactor = (expiryDate) => {
  const days = Math.ceil((new Date(expiryDate) - Date.now()) / 86400000);
  if (days <= 3) return 3.0;
  if (days <= 7) return 2.0;
  if (days <= 14) return 1.5;
  if (days <= 21) return 1.2;
  return 1.0;
};

const submit = async (req, res, next) => {
  try {
    const { title, body, category, expiry_date, confidence_stake, branch_scope } = req.body;
    const id = uuidv4();
    const { rows } = await pool.query(
      `INSERT INTO tips (id, author_id, college_id, title, body, category, expiry_date, confidence_stake, branch_scope, status)
       VALUES ($1,$2,(SELECT college_id FROM users WHERE id=$2),$3,$4,$5,$6,$7,$8,'PENDING_COSIGN') RETURNING *`,
      [id, req.user.id, title, body, category, expiry_date, confidence_stake, branch_scope || []]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

const getFeed = async (req, res, next) => {
  try {
    const { branch } = req.query;
    const { rows } = await pool.query(
      `SELECT t.*, u.name as author_name, u.credibility_score as author_credibility
       FROM tips t JOIN users u ON t.author_id = u.id
       WHERE t.college_id = (SELECT college_id FROM users WHERE id = $1)
         AND t.status = 'LIVE'
         AND (t.branch_scope = '{}' OR $2 = ANY(t.branch_scope))
       ORDER BY t.feed_score DESC`,
      [req.user.id, branch || null]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, u.name as author_name, u.credibility_score as author_credibility
       FROM tips t JOIN users u ON t.author_id = u.id WHERE t.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Tip not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const cosign = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tips WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Tip not found' });
    if (rows[0].status !== 'PENDING_COSIGN') return res.status(400).json({ error: 'Tip not awaiting cosign' });
    if (rows[0].author_id === req.user.id) return res.status(400).json({ error: 'Cannot cosign your own tip' });

    const tip = rows[0];
    const feedScore = (URGENCY_WEIGHTS[tip.category] * daysRemainingFactor(tip.expiry_date)) * ((await pool.query('SELECT credibility_score FROM users WHERE id=$1', [tip.author_id])).rows[0].credibility_score / 100);

    await pool.query(
      `UPDATE tips SET cosigner_id=$1, status='LIVE', feed_score=$2 WHERE id=$3`,
      [req.user.id, feedScore, req.params.id]
    );
    res.json({ message: 'Tip is now live' });
  } catch (err) { next(err); }
};

const confirm = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tips WHERE id=$1 AND status=\'EXPIRED\'', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Tip not found or not expired yet' });

    const tip = rows[0];
    const deltas = { LOW: 5, MEDIUM: 10, HIGH: 15 };
    await pool.query(
      `UPDATE users SET credibility_score = LEAST(100, credibility_score + $1) WHERE id = $2`,
      [deltas[tip.confidence_stake], tip.author_id]
    );
    await pool.query(
      `INSERT INTO credibility_events (id, user_id, delta, reason, reference_id) VALUES ($1,$2,$3,'tip_confirmed',$4)`,
      [uuidv4(), tip.author_id, deltas[tip.confidence_stake], tip.id]
    );
    res.json({ message: 'Tip confirmed as accurate' });
  } catch (err) { next(err); }
};

module.exports = { submit, getFeed, getOne, cosign, confirm };
