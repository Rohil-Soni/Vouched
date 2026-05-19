const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');

const LOSS = { LOW: 10, MEDIUM: 17, HIGH: 25 };

const file = async (req, res, next) => {
  try {
    const { tip_id, q1_what_wrong, q2_acted_on_tip, q3_actual_outcome, q4_when_happened, q5_evidence } = req.body;
    if (!q2_acted_on_tip) return res.status(400).json({ error: 'You must have personally acted on the tip to dispute it' });

    const { rows } = await pool.query(
      `INSERT INTO disputes (id, tip_id, reporter_id, q1_what_wrong, q2_acted_on_tip, q3_actual_outcome, q4_when_happened, q5_evidence, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'OPEN') RETURNING *`,
      [uuidv4(), tip_id, req.user.id, q1_what_wrong, q2_acted_on_tip, q3_actual_outcome, q4_when_happened, q5_evidence || null]
    );
    await pool.query(`UPDATE tips SET status='DISPUTED' WHERE id=$1`, [tip_id]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM disputes WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Dispute not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const getQueue = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.* FROM disputes d
       JOIN tips t ON d.tip_id = t.id
       JOIN users u ON u.id = $1
       WHERE t.college_id = u.college_id AND d.status = 'OPEN'`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const vote = async (req, res, next) => {
  try {
    const { vote } = req.body;
    const { rows: dispute } = await pool.query('SELECT * FROM disputes WHERE id=$1', [req.params.id]);
    if (!dispute.length) return res.status(404).json({ error: 'Dispute not found' });

    await pool.query(
      `INSERT INTO dispute_votes (id, dispute_id, moderator_id, vote) VALUES ($1,$2,$3,$4)`,
      [uuidv4(), req.params.id, req.user.id, vote]
    );

    const { rows: votes } = await pool.query('SELECT vote FROM dispute_votes WHERE dispute_id=$1', [req.params.id]);
    if (votes.length < 3) return res.json({ message: 'Vote recorded' });

    const upheld = votes.filter(v => v.vote === 'UPHOLD').length;
    const tip = (await pool.query('SELECT * FROM tips WHERE id=$1', [dispute[0].tip_id])).rows[0];

    if (upheld >= 2) {
      await pool.query(`UPDATE tips SET status='REMOVED' WHERE id=$1`, [tip.id]);
      await pool.query(`UPDATE disputes SET status='UPHELD', resolved_at=NOW() WHERE id=$1`, [req.params.id]);
      const loss = LOSS[tip.confidence_stake];
      await pool.query(`UPDATE users SET credibility_score=GREATEST(0,credibility_score-$1) WHERE id=$2`, [loss, tip.author_id]);
      await pool.query(`UPDATE users SET credibility_score=GREATEST(0,credibility_score-5) WHERE id=$1`, [tip.cosigner_id]);
      await pool.query(`INSERT INTO credibility_events(id,user_id,delta,reason,reference_id) VALUES($1,$2,$3,'dispute_upheld',$4)`, [uuidv4(), tip.author_id, -loss, tip.id]);
    } else {
      await pool.query(`UPDATE tips SET status='LIVE' WHERE id=$1`, [tip.id]);
      await pool.query(`UPDATE disputes SET status='REJECTED', resolved_at=NOW() WHERE id=$1`, [req.params.id]);
      await pool.query(`UPDATE users SET credibility_score=GREATEST(0,credibility_score-5) WHERE id=$1`, [dispute[0].reporter_id]);
      await pool.query(`INSERT INTO credibility_events(id,user_id,delta,reason,reference_id) VALUES($1,$2,-5,'dispute_rejected',$3)`, [uuidv4(), dispute[0].reporter_id, req.params.id]);
    }
    res.json({ message: 'Dispute resolved' });
  } catch (err) { next(err); }
};

module.exports = { file, getOne, getQueue, vote };
