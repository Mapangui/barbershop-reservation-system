/**
 * Main Application File
 * Barbershop Reservation Management System
 * Follows Google JavaScript Style Guide
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const {body} = require('express-validator');
require('dotenv').config();

const dbInstance = require('./config/database');
const ReservationController = require('./controllers/reservationController');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Barbershop Reservation API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      reservations: '/api/reservations',
      availableSlots: '/api/available-slots',
    },
  });
});

// Validation middleware for reservation creation
const reservationValidation = [
  body('customerName').notEmpty().trim().isLength({min: 2, max: 100}),
  body('customerEmail').isEmail().normalizeEmail(),
  body('customerPhone').notEmpty().trim(),
  body('barberId').notEmpty().isUUID(),
  body('barberName').notEmpty().trim(),
  body('serviceType').isIn(['haircut', 'shave', 'beard-trim', 'full-service']),
  body('appointmentDate').isDate(),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  body('price').isDecimal(),
];

// Reservation routes
app.post(
    '/api/reservations',
    reservationValidation,
    ReservationController.createReservation
);

app.get('/api/reservations', ReservationController.getAllReservations);

app.get('/api/reservations/:id', ReservationController.getReservationById);

app.put('/api/reservations/:id', ReservationController.updateReservation);

app.delete('/api/reservations/:id', ReservationController.cancelReservation);

app.get('/api/available-slots', ReservationController.getAvailableSlots);

// Mock barbers endpoint (for demo)
app.get('/api/barbers', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Smith',
        specialties: ['haircut', 'beard-trim'],
        rating: 4.8,
        image: 'https://i.pravatar.cc/150?img=12',
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        name: 'Mike Johnson',
        specialties: ['full-service', 'shave'],
        rating: 4.9,
        image: 'https://i.pravatar.cc/150?img=13',
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174002',
        name: 'David Brown',
        specialties: ['haircut', 'full-service'],
        rating: 4.7,
        image: 'https://i.pravatar.cc/150?img=14',
      },
    ],
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

/**
 * Start server
 */
async function startServer() {
  try {
    // Test database connection
    await dbInstance.testConnection();

    // Sync database models
    await dbInstance.syncModels();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║   Barbershop Reservation API Server      ║
║   Running on port: ${PORT}                  ║
║   Environment: ${process.env.NODE_ENV || 'development'}            ║
║   Health check: http://localhost:${PORT}/health ║
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await dbInstance.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await dbInstance.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;