const router = require('express').Router();
const { submit, getFeed, getOne, cosign, confirm } = require('../controllers/tips');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getFeed);
router.get('/:id', getOne);
router.post('/', requireRole('SENIOR'), submit);
router.patch('/:id/cosign', requireRole('SENIOR'), cosign);
router.post('/:id/confirm', confirm);

module.exports = router;
