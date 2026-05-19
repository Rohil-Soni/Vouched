const router = require('express').Router();
const { getMyNudges, markOpened } = require('../controllers/nudges');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getMyNudges);
router.patch('/:id/open', markOpened);

module.exports = router;
