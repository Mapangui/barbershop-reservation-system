/**
 * Reservation API Tests
 * Testing Strategy: Unit and Integration Tests
 * Framework: Jest + Supertest
 */

const request = require('supertest');
const app = require('../src/app');
const Reservation = require('../src/models/Reservation');
const dbInstance = require('../src/config/database');

describe('Barbershop Reservation API Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await dbInstance.testConnection();
    await dbInstance.syncModels();
  });

  afterAll(async () => {
    // Cleanup
    await dbInstance.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await Reservation.destroy({where: {}, truncate: true});
  });

  // Test 1: Health Check
  describe('GET /health', () => {
    it('should return server health status', async () => {
      const res = await request(app).get('/health');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Server is running');
    });
  });

  // Test 2: Create Reservation - Success
  describe('POST /api/reservations', () => {
    it('should create a new reservation with valid data', async () => {
      const reservationData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890',
        barberId: '123e4567-e89b-12d3-a456-426614174000',
        barberName: 'John Smith',
        serviceType: 'haircut',
        appointmentDate: '2025-12-25',
        appointmentTime: '10:00:00',
        duration: 30,
        price: 25.00,
      };

      const res = await request(app)
          .post('/api/reservations')
          .send(reservationData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.customerName).toBe('John Doe');
      expect(res.body.data.status).toBe('pending');
    });

    it('should fail with invalid email', async () => {
      const invalidData = {
        customerName: 'John Doe',
        customerEmail: 'invalid-email',
        customerPhone: '+1234567890',
        barberId: '123e4567-e89b-12d3-a456-426614174000',
        barberName: 'John Smith',
        serviceType: 'haircut',
        appointmentDate: '2025-12-25',
        appointmentTime: '10:00:00',
        price: 25.00,
      };

      const res = await request(app)
          .post('/api/reservations')
          .send(invalidData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // Test 3: Get All Reservations
  describe('GET /api/reservations', () => {
    it('should return all reservations', async () => {
      // Create test reservation
      await Reservation.create({
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
        barberId: '123e4567-e89b-12d3-a456-426614174000',
        barberName: 'John Smith',
        serviceType: 'haircut',
        appointmentDate: '2025-12-25',
        appointmentTime: '10:00:00',
        price: 25.00,
      });

      const res = await request(app).get('/api/reservations');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter reservations by status', async () => {
      await Reservation.create({
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
        barberId: '123e4567-e89b-12d3-a456-426614174000',
        barberName: 'John Smith',
        serviceType: 'haircut',
        appointmentDate: '2025-12-25',
        appointmentTime: '10:00:00',
        price: 25.00,
        status: 'confirmed',
      });

      const res = await request(app).get('/api/reservations?status=confirmed');

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].status).toBe('confirmed');
    });
  });

  // Test 4: Get Reservation by ID
  describe('GET /api/reservations/:id', () => {
    it('should return reservation by ID', async () => {
      const reservation = await Reservation.create({
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
        barberId: '123e4567-e89b-12d3-a456-426614174000',
        barberName: 'John Smith',
        serviceType: 'haircut',
        appointmentDate: '2025-12-25',
        appointmentTime: '10:00:00',
        price: 25.00,
      });

      const res = await request(app).get(`/api/reservations/${reservation.id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(reservation.id);
    });

    it('should return 404 for non-existent reservation', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';
      const res = await request(app).get(`/api/reservations/${fakeId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // Test 5: Cancel Reservation
  describe('DELETE /api/reservations/:id', () => {
    it('should cancel reservation', async () => {
      const reservation = await Reservation.create({
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
        barberId: '123e4567-e89b-12d3-a456-426614174000',
        barberName: 'John Smith',
        serviceType: 'haircut',
        appointmentDate: '2025-12-25',
        appointmentTime: '10:00:00',
        price: 25.00,
      });

      const res = await request(app).delete(`/api/reservations/${reservation.id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('cancelled');
    });
  });

  // Test 6: Get Available Slots
  describe('GET /api/available-slots', () => {
    it('should return available time slots', async () => {
      const barberId = '123e4567-e89b-12d3-a456-426614174000';
      const date = '2025-12-25';

      const res = await request(app).get(
          `/api/available-slots?barberId=${barberId}&date=${date}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.availableSlots)).toBe(true);
    });

    it('should fail without required parameters', async () => {
      const res = await request(app).get('/api/available-slots');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // Test 7: Get Barbers
  describe('GET /api/barbers', () => {
    it('should return list of barbers', async () => {
      const res = await request(app).get('/api/barbers');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // Test 8: API Root
  describe('GET /api', () => {
    it('should return API information', async () => {
      const res = await request(app).get('/api');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('endpoints');
    });
  });

  // Test 9: 404 Handler
  describe('404 Not Found', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});

/**
 * Test Coverage Summary:
 * 
 * 1. Health Check - Server availability
 * 2. Create Reservation - Valid and invalid data
 * 3. Get All Reservations - With and without filters
 * 4. Get Reservation by ID - Success and 404 cases
 * 5. Cancel Reservation - Status update
 * 6. Get Available Slots - With parameters
 * 7. Get Barbers - List endpoint
 * 8. API Root - Information endpoint
 * 9. 404 Handler - Error handling
 * 
 * Test Types:
 * - Unit Tests: Individual function testing
 * - Integration Tests: API endpoint testing
 * - Validation Tests: Input validation
 * - Error Handling Tests: Edge cases
 */