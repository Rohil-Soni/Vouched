const router = require('express').Router();
const { file, getOne, getQueue, vote } = require('../controllers/disputes');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.post('/', file);
router.get('/queue', requireRole('MODERATOR', 'ADMIN'), getQueue);
router.get('/:id', getOne);
router.post('/:id/vote', requireRole('MODERATOR', 'ADMIN'), vote);

module.exports = router;
