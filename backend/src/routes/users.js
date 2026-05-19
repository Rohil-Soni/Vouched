const router = require('express').Router();
const { getMe, updateMe, getPublicProfile, getCredibilityHistory } = require('../controllers/users');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/me', getMe);
router.patch('/me', updateMe);
router.get('/me/credibility', getCredibilityHistory);
router.get('/:id', getPublicProfile);

module.exports = router;
