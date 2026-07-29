const path = require('path');
require('dotenv').config();
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

const configuredOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URL_ALT, process.env.FRONTEND_URLS]
  .filter(Boolean)
  .flatMap(value => value.split(',').map(origin => origin.trim()));
const allowedOrigins = new Set([
  ...configuredOrigins,
  'https://brightsoulspa.in',
  'https://www.brightsoulspa.in',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
]);

app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.has(origin)) {
    return callback(null, true);
  }
  callback(new Error(`CORS origin denied: ${origin}`));
}, credentials: true }));
app.options('*', cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)), credentials: true }));
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

require('./models');
require('./models/associations')();

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Bright Soul API running' }));

sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
}).catch((err) => {
  console.error('Sync error:', err.message);
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection established');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }

  const server = app.listen(PORT, '0.0.0.0', () => console.log(`Bright Soul API running on http://0.0.0.0:${PORT}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please stop the process using it or set PORT to a free port in your .env file.`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });
}

startServer();

module.exports = app;
