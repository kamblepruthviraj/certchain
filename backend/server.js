require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const seedUsers = require('./config/seed');

const authRoutes = require('./routes/authRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const verifyRoutes = require('./routes/verifyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verify', verifyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    system: 'Secure Digital Certificate Management System (30% Milestone)',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found.`
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Server bootstrapper
const startServer = async () => {
  await connectDB();
  await seedUsers();

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`[Server] Secure Certificate Server running on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
