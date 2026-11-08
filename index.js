const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://studiospace.vercel.app',
  'https://studiospace.netlify.app',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.some(
          (allowed) =>
            origin === allowed ||
            origin.endsWith('.vercel.app') ||
            origin.endsWith('.netlify.app')
        )
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(require('./middleware/logger'));

const getHealthPayload = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbStatus = stateMap[mongoose.connection.readyState] || 'unknown';
  return {
    success: true,
    status: 'operational',
    service: 'StudioSpace Backend API',
    version: '1.0.0',
    database: {
      status: dbStatus,
      connected: mongoose.connection.readyState === 1,
      host: mongoose.connection.host || 'cluster0.zudkfaa.mongodb.net',
    },
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
};

app.get('/', (req, res) => {
  res.status(200).json(getHealthPayload());
});

app.get('/health', (req, res) => {
  res.status(200).json(getHealthPayload());
});

app.get('/api/health', (req, res) => {
  res.status(200).json(getHealthPayload());
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/studios', require('./routes/studios'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/wishlist', require('./routes/wishlist'));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`[Server] StudioSpace backend running on http://localhost:${PORT}`);
});
