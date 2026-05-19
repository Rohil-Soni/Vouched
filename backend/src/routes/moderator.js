const router = require('express').Router();
const { pool } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// Get disputes for moderator review
router.get('/disputes', requireRole('MODERATOR', 'ADMIN'), async (req, res, next) => {
  try {
    const status = req.query.status || 'OPEN';
    const userId = req.user.id;

    // Get user credibility - must be 75+ to moderate
    const { rows: userCheck } = await pool.query('SELECT credibility_score FROM users WHERE id = $1', [userId]);
    if (!userCheck.length || userCheck[0].credibility_score < 75) {
      return res.status(403).json({ error: 'Insufficient credibility to moderate' });
    }

    // Get disputes with tip and user details
    const { rows: disputes } = await pool.query(`
      SELECT 
        d.id, d.tip_id, d.reporter_id, d.status, d.created_at,
        d.q1_what_wrong, d.q3_actual_outcome, d.q5_evidence,
        t.title as tip_title, t.author_id,
        reporter.name as reporter_name,
        author.name as author_name
      FROM disputes d
      JOIN tips t ON d.tip_id = t.id
      JOIN users reporter ON d.reporter_id = reporter.id
      JOIN users author ON t.author_id = author.id
      WHERE d.status = $1
      ORDER BY d.created_at DESC
      LIMIT 50
    `, [status]);

    res.json(disputes);
  } catch (err) { next(err); }
});

// Submit vote on dispute
router.post('/disputes/:id/vote', requireRole('MODERATOR', 'ADMIN'), async (req, res, next) => {
  try {
    const { id: disputeId } = req.params;
    const { vote } = req.body;
    const userId = req.user.id;

    if (!['UPHOLD', 'REJECT'].includes(vote)) {
      return res.status(400).json({ error: 'Vote must be UPHOLD or REJECT' });
    }

    // Check credibility
    const { rows: userCheck } = await pool.query('SELECT credibility_score FROM users WHERE id = $1', [userId]);
    if (!userCheck.length || userCheck[0].credibility_score < 75) {
      return res.status(403).json({ error: 'Insufficient credibility to moderate' });
    }

    // Get dispute and tip details
    const { rows: disputeData } = await pool.query(
      'SELECT tip_id, reporter_id FROM disputes WHERE id = $1',
      [disputeId]
    );
    if (!disputeData.length) return res.status(404).json({ error: 'Dispute not found' });

    const { tip_id: tipId, reporter_id: reporterId } = disputeData[0];

    // Record vote
    await pool.query(
      'INSERT INTO dispute_votes (id, dispute_id, moderator_id, vote) VALUES (gen_random_uuid(), $1, $2, $3)',
      [disputeId, userId, vote]
    );

    // Get all votes for this dispute (need 3 votes to resolve)
    const { rows: votes } = await pool.query(
      'SELECT COUNT(*), COUNT(CASE WHEN vote = $1 THEN 1 END) as upholds FROM dispute_votes WHERE dispute_id = $2',
      ['UPHOLD', disputeId]
    );
    
    const totalVotes = parseInt(votes[0].count);
    const upholds = parseInt(votes[0].upholds);

    // If 3 votes reached, resolve the dispute
    if (totalVotes >= 3) {
      const finalVote = upholds >= 2 ? 'UPHELD' : 'REJECTED';

      // Update dispute status
      await pool.query(
        'UPDATE disputes SET status = $1, resolved_at = NOW() WHERE id = $2',
        [finalVote, disputeId]
      );

      // Update credibility scores based on outcome
      if (finalVote === 'UPHELD') {
        // Tip author loses credibility
        await pool.query(
          'UPDATE users SET credibility_score = GREATEST(0, credibility_score - 25) WHERE id IN (SELECT author_id FROM tips WHERE id = $1)',
          [tipId]
        );
        // Reporter gains credibility
        await pool.query(
          'UPDATE users SET credibility_score = LEAST(100, credibility_score + 15) WHERE id = $1',
          [reporterId]
        );
      } else {
        // Reporter loses credibility
        await pool.query(
          'UPDATE users SET credibility_score = GREATEST(0, credibility_score - 20) WHERE id = $1',
          [reporterId]
        );
        // Tip author gains credibility (dispute rejected)
        await pool.query(
          'UPDATE users SET credibility_score = LEAST(100, credibility_score + 10) WHERE id IN (SELECT author_id FROM tips WHERE id = $1)',
          [tipId]
        );
      }

      // Log credibility events
      const tipAuthorRes = await pool.query('SELECT author_id FROM tips WHERE id = $1', [tipId]);
      if (tipAuthorRes.rows.length) {
        const authorId = tipAuthorRes.rows[0].author_id;
        const delta = finalVote === 'UPHELD' ? -25 : 10;
        await pool.query(
          'INSERT INTO credibility_events (id, user_id, delta, reason, reference_id) VALUES (gen_random_uuid(), $1, $2, $3, $4)',
          [authorId, delta, `Dispute ${finalVote.toLowerCase()} on your tip`, tipId]
        );
      }
    }

    res.json({ message: `Vote recorded: ${vote}`, resolved: totalVotes >= 3 });
  } catch (err) { next(err); }
});

module.exports = router;
