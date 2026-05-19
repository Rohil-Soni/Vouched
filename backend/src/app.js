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
const moderatorRoutes = require('./routes/moderator');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS configuration - environment-aware
const corsOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [corsOrigin]
  : [corsOrigin, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Vouched API is running', status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/tips', tipRoutes);
app.use('/disputes', disputeRoutes);
app.use('/archive', archiveRoutes);
app.use('/nudges', nudgeRoutes);
app.use('/moderator', moderatorRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
