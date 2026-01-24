import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import { UserRole, UserStatus } from '../types';
import database from '../config/database';
import logger from '../utils/logger';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Seed script to create admin user
 * Usage: npm run seed
 */
const seedAdminUser = async () => {
  try {
    // Connect to database
    await database.connect();
    logger.info('Database connected successfully');

    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin1234';
    const adminData = {
      email: adminEmail,
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    };

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      logger.warn(`Admin user with email ${adminEmail} already exists`);
      
      // Update existing admin if needed
      if (existingAdmin.role !== UserRole.ADMIN || existingAdmin.status !== UserStatus.ACTIVE) {
        existingAdmin.role = UserRole.ADMIN;
        existingAdmin.status = UserStatus.ACTIVE;
        existingAdmin.isEmailVerified = true;
        await existingAdmin.save();
        logger.info('Updated existing admin user');
      } else {
        logger.info('Admin user is already set up correctly');
      }
    } else {
      // Create new admin user
      const admin = await User.create(adminData);
      logger.info(`Admin user created successfully:
        Email: ${admin.email}
        Name: ${admin.firstName} ${admin.lastName}
        Role: ${admin.role}
        Status: ${admin.status}
      `);
    }

    logger.info('Seed script completed successfully');
    
    // Disconnect from database
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error running seed script:', error);
    
    // Try to disconnect even on error
    try {
      await database.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
    
    process.exit(1);
  }
};

// Run the seed function
seedAdminUser();
