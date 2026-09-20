require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const seedUsers = require('./config/seed');

const authRoutes = require('./routes/authRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const merkleRoutes = require('./routes/merkleRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const securityRoutes = require('./routes/securityRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware: HTTP headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: false // Allow cross-origin asset sharing for frontend dev
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Payload Limiting (1MB)
app.use(express.json({ limit: '1mb' }));

// NoSQL Query Injection Sanitization Middleware
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
});

// Rate Limiting: Prevent brute-force on authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  }
});

// Rate Limiting: Prevent scraping on public verification
const verifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 120, // 120 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test'
});

// Mount Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verify', verifyLimiter, verifyRoutes);
app.use('/api/public', merkleRoutes);
app.use('/api/secure-delivery', deliveryRoutes);
app.use('/api/security', securityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    system: 'CertChain: Secure Digital Certificate Management System (100% Implementation)',
    features: [
      'Deterministic Canonicalization & SHA-256 Hashing',
      'Immutable Hash Chaining',
      '2-of-3 Ed25519 Cryptographic Threshold Signatures',
      'Persistent Merkle Trees & Public Zero-PII Root Registry',
      'Merkle Inclusion Proof Verification',
      'X25519 Diffie-Hellman Key Agreement + AES-256-GCM Secure Delivery',
      'Cryptographic Key Evolution (ACTIVE, ROTATED, REVOKED)',
      'Internal Verifiable Cryptographic Timestamp Authority (TSA)',
      'Security Audit Logging',
      'Role-Based Access Control (Admin, Official, Student, Verifier)'
    ],
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
      console.log(`[Server] CertChain Server running on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
