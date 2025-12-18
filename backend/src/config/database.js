/**
 * Database Configuration using Singleton Pattern
 * Ensures only one database connection exists throughout the application
 * 
 * Design Pattern: Singleton
 * Purpose: Single database connection instance
 */

const {Sequelize} = require('sequelize');
require('dotenv').config();

/**
 * DatabaseConnection class implementing Singleton pattern
 */
class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }

    // Create Sequelize instance
    this.sequelize = new Sequelize(
        process.env.DATABASE_URL || 
        'postgresql://barbershop:barbershop123@localhost:5432/barbershop',
        {
          dialect: 'postgres',
          logging: process.env.NODE_ENV === 'development' ? console.log : false,
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
          },
        }
    );

    DatabaseConnection.instance = this;
  }

  /**
   * Get database instance
   * @return {Sequelize} Database connection
   */
  getConnection() {
    return this.sequelize;
  }

  /**
   * Test database connection
   * @return {Promise} Connection result
   */
  async testConnection() {
    try {
      await this.sequelize.authenticate();
      console.log('✅ Database connection established successfully');
      return true;
    } catch (error) {
      console.error('❌ Unable to connect to database:', error);
      return false;
    }
  }

  /**
   * Sync database models
   * @return {Promise} Sync result
   */
  async syncModels() {
    try {
      await this.sequelize.sync({alter: true});
      console.log('✅ Database models synchronized');
      return true;
    } catch (error) {
      console.error('❌ Model sync failed:', error);
      return false;
    }
  }

  /**
   * Close database connection
   * @return {Promise} Close result
   */
  async close() {
    try {
      await this.sequelize.close();
      console.log('✅ Database connection closed');
      return true;
    } catch (error) {
      console.error('❌ Error closing database:', error);
      return false;
    }
  }
}

// Export singleton instance
const dbInstance = new DatabaseConnection();
module.exports = dbInstance;