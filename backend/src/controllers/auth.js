const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { sendOTP } = require('../utils/mailer');

const otpStore = new Map(); // { email: { otp, expires } }

const signup = async (req, res, next) => {
  try {
    const { email, name, branch, year_of_study } = req.body;
    const domain = email.split('@')[1];
    const { rows } = await pool.query('SELECT id FROM colleges WHERE email_domain = $1', [domain]);
    if (!rows.length) return res.status(400).json({ error: 'College email domain not supported' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const role = year_of_study >= 3 ? 'SENIOR' : 'FRESHER';
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000, name, branch, year_of_study, college_id: rows[0].id, role });

    await sendOTP(email, otp);
    res.json({ message: 'OTP sent to your college email' });
  } catch (err) { next(err); }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore.get(email);
    if (!record || record.otp !== otp || Date.now() > record.expires)
      return res.status(400).json({ error: 'Invalid or expired OTP' });

    const { name, branch, year_of_study, college_id, role } = record;
    const { rows } = await pool.query(
      `INSERT INTO users (id, email, name, college_id, branch, year_of_study, role, is_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true) RETURNING id, email, name, role, credibility_score`,
      [uuidv4(), email, name, college_id, branch, year_of_study, role]
    );
    otpStore.delete(email);

    const token = jwt.sign({ id: rows[0].id, role: rows[0].role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refresh = jwt.sign({ id: rows[0].id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '365d' });
    res.cookie('refresh', refresh, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 365 * 24 * 60 * 60 * 1000 });
    res.json({ token, user: rows[0] });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { rows } = await pool.query('SELECT id, role, is_verified FROM users WHERE email = $1', [email]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    if (!rows[0].is_verified) return res.status(403).json({ error: 'Account not verified' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000, userId: rows[0].id, role: rows[0].role });
    await sendOTP(email, otp);
    res.json({ message: 'OTP sent' });
  } catch (err) { next(err); }
};

const verifyLoginOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore.get(email);
    if (!record || record.otp !== otp || Date.now() > record.expires)
      return res.status(400).json({ error: 'Invalid or expired OTP' });

    otpStore.delete(email);
    const token = jwt.sign({ id: record.userId, role: record.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refresh = jwt.sign({ id: record.userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '365d' });
    res.cookie('refresh', refresh, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 365 * 24 * 60 * 60 * 1000 });
    res.json({ token });
  } catch (err) { next(err); }
};

const refresh = (req, res) => {
  const token = req.cookies?.refresh;
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const newToken = jwt.sign({ id: payload.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ token: newToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const logout = (req, res) => {
  res.clearCookie('refresh');
  res.json({ message: 'Logged out' });
};

module.exports = { signup, verifyOTP, login, verifyLoginOTP, refresh, logout };
