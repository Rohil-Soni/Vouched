const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tipRoutes = require('./routes/tips');
const disputeRoutes = require('./routes/disputes');
const archiveRoutes = require('./routes/archive');
const nudgeRoutes = require('./routes/nudges');

const app = express();

app.use(helmet());
app.use(cors({ origin: /^http:\/\/localhost:\d+$/, credentials: true }));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Vouched API is running', status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/tips', tipRoutes);
app.use('/disputes', disputeRoutes);
app.use('/archive', archiveRoutes);
app.use('/nudges', nudgeRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
