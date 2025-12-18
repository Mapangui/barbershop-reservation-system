/**
 * Notification Factory - Factory Design Pattern
 * Creates different types of notification services
 * 
 * Design Pattern: Factory
 * Purpose: Create notification objects based on type
 */

const nodemailer = require('nodemailer');

/**
 * Base Notification class
 */
class Notification {
  /**
   * Send notification
   * @param {Object} data Notification data
   * @return {Promise} Send result
   */
  async send(data) {
    throw new Error('send() must be implemented by subclass');
  }
}

/**
 * Email Notification implementation
 */
class EmailNotification extends Notification {
  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'test@example.com',
        pass: process.env.SMTP_PASS || 'password',
      },
    });
  }

  /**
   * Send email notification
   * @param {Object} data Email data
   * @return {Promise} Send result
   */
  async send(data) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@barbershop.com',
        to: data.recipient,
        subject: data.subject,
        html: this.buildEmailTemplate(data),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent: ${info.messageId}`);
      return {success: true, messageId: info.messageId};
    } catch (error) {
      console.error('❌ Email send failed:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * Build email HTML template
   * @param {Object} data Template data
   * @return {string} HTML template
   */
  buildEmailTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 10px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Barbershop Reservation</h1>
          </div>
          <div class="content">
            ${data.body}
          </div>
          <div class="footer">
            <p>Thank you for choosing our barbershop!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

/**
 * SMS Notification implementation
 */
class SMSNotification extends Notification {
  /**
   * Send SMS notification
   * @param {Object} data SMS data
   * @return {Promise} Send result
   */
  async send(data) {
    // Simulated SMS sending (integrate with Twilio, etc.)
    console.log(`📱 SMS sent to ${data.recipient}: ${data.message}`);
    return {
      success: true,
      message: 'SMS sent successfully',
    };
  }
}

/**
 * Push Notification implementation
 */
class PushNotification extends Notification {
  /**
   * Send push notification
   * @param {Object} data Push data
   * @return {Promise} Send result
   */
  async send(data) {
    // Simulated push notification (integrate with FCM, etc.)
    console.log(`🔔 Push notification sent to ${data.recipient}: ${data.message}`);
    return {
      success: true,
      message: 'Push notification sent successfully',
    };
  }
}

/**
 * NotificationFactory class - Factory Pattern implementation
 */
class NotificationFactory {
  /**
   * Create notification service based on type
   * @param {string} type Notification type
   * @return {Notification} Notification instance
   */
  static createNotification(type) {
    switch (type.toLowerCase()) {
      case 'email':
        return new EmailNotification();
      case 'sms':
        return new SMSNotification();
      case 'push':
        return new PushNotification();
      default:
        throw new Error(`Unsupported notification type: ${type}`);
    }
  }

  /**
   * Send notification of specified type
   * @param {string} type Notification type
   * @param {Object} data Notification data
   * @return {Promise} Send result
   */
  static async send(type, data) {
    try {
      const notification = this.createNotification(type);
      return await notification.send(data);
    } catch (error) {
      console.error('❌ Notification failed:', error);
      return {success: false, error: error.message};
    }
  }
}

module.exports = NotificationFactory;