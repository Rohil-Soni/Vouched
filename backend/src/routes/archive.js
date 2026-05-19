const router = require('express').Router();
const { submit, browse, getOne, vouch, getModQueue, moderate } = require('../controllers/archive');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.post('/', requireRole('SENIOR'), submit);
router.get('/', browse);
router.get('/modqueue', requireRole('MODERATOR', 'ADMIN'), getModQueue);
router.get('/:id', getOne);
router.post('/:id/vouch', requireRole('SENIOR'), vouch);
router.post('/:id/moderate', requireRole('MODERATOR', 'ADMIN'), moderate);

module.exports = router;
