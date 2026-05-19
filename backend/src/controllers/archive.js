const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');

// Naive name detection — flag entries with patterns like "Prof X" or "Dr Y"
const containsIndividualName = (text) => /\b(prof|professor|dr|mr|ms|mrs)\.?\s+[A-Z][a-z]+/i.test(text);

const submit = async (req, res, next) => {
  try {
    const { body, category, branch } = req.body;
    if (body.length < 50) return res.status(400).json({ error: 'Submission too short to be useful' });
    if (containsIndividualName(body)) return res.status(400).json({ error: 'Submissions must not name individuals' });

    const { rows } = await pool.query(
      `INSERT INTO archive_entries (id, college_id, branch, category, body, status, expires_at)
       VALUES ($1,(SELECT college_id FROM users WHERE id=$2),$3,$4,$5,'PENDING', NOW() + INTERVAL '2 years') RETURNING id`,
      [uuidv4(), req.user.id, branch || null, category, body]
    );
    res.status(201).json({ id: rows[0].id, message: 'Submitted for moderation' });
  } catch (err) { next(err); }
};

const browse = async (req, res, next) => {
  try {
    const { category } = req.query;
    const { rows } = await pool.query(
      `SELECT id, branch, category, body, vouch_count, expires_at FROM archive_entries
       WHERE college_id=(SELECT college_id FROM users WHERE id=$1)
         AND status='LIVE'
         AND ($2::text IS NULL OR category=$2)
       ORDER BY vouch_count DESC`,
      [req.user.id, category || null]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM archive_entries WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Entry not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const vouch = async (req, res, next) => {
  try {
    const existing = await pool.query('SELECT id FROM archive_vouches WHERE entry_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (existing.rows.length) return res.status(409).json({ error: 'Already vouched' });

    await pool.query(`INSERT INTO archive_vouches (id, entry_id, user_id) VALUES ($1,$2,$3)`, [uuidv4(), req.params.id, req.user.id]);
    await pool.query(`UPDATE archive_entries SET vouch_count=vouch_count+1, expires_at=NOW()+INTERVAL '2 years' WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Vouched and expiry reset' });
  } catch (err) { next(err); }
};

const getModQueue = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ae.* FROM archive_entries ae
       JOIN users u ON u.id=$1
       WHERE ae.college_id=u.college_id AND ae.status='PENDING'`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const moderate = async (req, res, next) => {
  try {
    const { decision } = req.body; // 'APPROVE' or 'REJECT'
    const status = decision === 'APPROVE' ? 'LIVE' : 'REJECTED';
    await pool.query(`UPDATE archive_entries SET status=$1 WHERE id=$2`, [status, req.params.id]);
    res.json({ message: `Entry ${status.toLowerCase()}` });
  } catch (err) { next(err); }
};

module.exports = { submit, browse, getOne, vouch, getModQueue, moderate };
