/**
 * Reservation Controller
 * Handles all reservation-related business logic
 * Follows Google JavaScript Style Guide
 */

const {validationResult} = require('express-validator');
const Reservation = require('../models/Reservation');
const NotificationFactory = require('../services/notificationFactory');

/**
 * ReservationController class
 */
class ReservationController {
  /**
   * Create new reservation
   * @param {Object} req Express request
   * @param {Object} res Express response
   * @return {Promise} Response
   */
  static async createReservation(req, res) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      // Create reservation
      const reservation = await Reservation.create(req.body);

      // Send confirmation email
      await NotificationFactory.send('email', {
        recipient: reservation.customerEmail,
        subject: 'Reservation Confirmed',
        body: `
          <h2>Hello ${reservation.customerName}!</h2>
          <p>Your reservation has been confirmed.</p>
          <ul>
            <li><strong>Service:</strong> ${reservation.serviceType}</li>
            <li><strong>Barber:</strong> ${reservation.barberName}</li>
            <li><strong>Date:</strong> ${reservation.appointmentDate}</li>
            <li><strong>Time:</strong> ${reservation.appointmentTime}</li>
            <li><strong>Price:</strong> $${reservation.price}</li>
          </ul>
          <p>We look forward to seeing you!</p>
        `,
      });

      return res.status(201).json({
        success: true,
        message: 'Reservation created successfully',
        data: reservation,
      });
    } catch (error) {
      console.error('❌ Create reservation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create reservation',
        error: error.message,
      });
    }
  }

  /**
   * Get all reservations
   * @param {Object} req Express request
   * @param {Object} res Express response
   * @return {Promise} Response
   */
  static async getAllReservations(req, res) {
    try {
      const {status, date} = req.query;
      const whereClause = {};

      if (status) whereClause.status = status;
      if (date) whereClause.appointmentDate = date;

      const reservations = await Reservation.findAll({
        where: whereClause,
        order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']],
      });

      return res.status(200).json({
        success: true,
        count: reservations.length,
        data: reservations,
      });
    } catch (error) {
      console.error('❌ Get reservations error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch reservations',
        error: error.message,
      });
    }
  }

  /**
   * Get reservation by ID
   * @param {Object} req Express request
   * @param {Object} res Express response
   * @return {Promise} Response
   */
  static async getReservationById(req, res) {
    try {
      const reservation = await Reservation.findByPk(req.params.id);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: reservation,
      });
    } catch (error) {
      console.error('❌ Get reservation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch reservation',
        error: error.message,
      });
    }
  }

  /**
   * Update reservation
   * @param {Object} req Express request
   * @param {Object} res Express response
   * @return {Promise} Response
   */
  static async updateReservation(req, res) {
    try {
      const reservation = await Reservation.findByPk(req.params.id);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found',
        });
      }

      await reservation.update(req.body);

      return res.status(200).json({
        success: true,
        message: 'Reservation updated successfully',
        data: reservation,
      });
    } catch (error) {
      console.error('❌ Update reservation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update reservation',
        error: error.message,
      });
    }
  }

  /**
   * Cancel reservation
   * @param {Object} req Express request
   * @param {Object} res Express response
   * @return {Promise} Response
   */
  static async cancelReservation(req, res) {
    try {
      const reservation = await Reservation.findByPk(req.params.id);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found',
        });
      }

      await reservation.update({status: 'cancelled'});

      // Send cancellation email
      await NotificationFactory.send('email', {
        recipient: reservation.customerEmail,
        subject: 'Reservation Cancelled',
        body: `
          <h2>Hello ${reservation.customerName}!</h2>
          <p>Your reservation has been cancelled.</p>
          <p>If you'd like to reschedule, please book a new appointment.</p>
        `,
      });

      return res.status(200).json({
        success: true,
        message: 'Reservation cancelled successfully',
        data: reservation,
      });
    } catch (error) {
      console.error('❌ Cancel reservation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel reservation',
        error: error.message,
      });
    }
  }

  /**
   * Get available time slots
   * @param {Object} req Express request
   * @param {Object} res Express response
   * @return {Promise} Response
   */
  static async getAvailableSlots(req, res) {
    try {
      const {barberId, date} = req.query;

      if (!barberId || !date) {
        return res.status(400).json({
          success: false,
          message: 'Barber ID and date are required',
        });
      }

      // Get existing reservations for the barber on that date
      const existingReservations = await Reservation.findAll({
        where: {
          barberId,
          appointmentDate: date,
          status: ['pending', 'confirmed'],
        },
      });

      // Generate available slots (9 AM to 6 PM)
      const allSlots = this.generateTimeSlots();
      const bookedTimes = existingReservations.map((r) => r.appointmentTime);
      const availableSlots = allSlots.filter(
          (slot) => !bookedTimes.includes(slot)
      );

      return res.status(200).json({
        success: true,
        date,
        barberId,
        availableSlots,
      });
    } catch (error) {
      console.error('❌ Get slots error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch available slots',
        error: error.message,
      });
    }
  }

  /**
   * Generate time slots helper
   * @return {Array} Time slots
   */
  static generateTimeSlots() {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30:00`);
    }
    return slots;
  }
}

module.exports = ReservationController;