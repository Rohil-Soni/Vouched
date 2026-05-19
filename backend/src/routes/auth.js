const router = require('express').Router();
const { signup, verifyOTP, login, verifyLoginOTP, refresh, logout } = require('../controllers/auth');

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/login/verify', verifyLoginOTP);
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
