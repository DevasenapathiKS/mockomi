"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const User_1 = __importDefault(require("../models/User"));
const types_1 = require("../types");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
/**
 * Seed script to create admin user
 * Usage: npm run seed
 */
const seedAdminUser = async () => {
    try {
        // Connect to database
        await database_1.default.connect();
        logger_1.default.info('Database connected successfully');
        const adminEmail = 'admin@gmail.com';
        const adminPassword = 'admin1234';
        const adminData = {
            email: adminEmail,
            password: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: types_1.UserRole.ADMIN,
            status: types_1.UserStatus.ACTIVE,
            isEmailVerified: true,
        };
        // Check if admin user already exists
        const existingAdmin = await User_1.default.findOne({ email: adminEmail });
        if (existingAdmin) {
            logger_1.default.warn(`Admin user with email ${adminEmail} already exists`);
            // Update existing admin if needed
            if (existingAdmin.role !== types_1.UserRole.ADMIN || existingAdmin.status !== types_1.UserStatus.ACTIVE) {
                existingAdmin.role = types_1.UserRole.ADMIN;
                existingAdmin.status = types_1.UserStatus.ACTIVE;
                existingAdmin.isEmailVerified = true;
                await existingAdmin.save();
                logger_1.default.info('Updated existing admin user');
            }
            else {
                logger_1.default.info('Admin user is already set up correctly');
            }
        }
        else {
            // Create new admin user
            const admin = await User_1.default.create(adminData);
            logger_1.default.info(`Admin user created successfully:
        Email: ${admin.email}
        Name: ${admin.firstName} ${admin.lastName}
        Role: ${admin.role}
        Status: ${admin.status}
      `);
        }
        logger_1.default.info('Seed script completed successfully');
        // Disconnect from database
        await database_1.default.disconnect();
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Error running seed script:', error);
        // Try to disconnect even on error
        try {
            await database_1.default.disconnect();
        }
        catch (disconnectError) {
            // Ignore disconnect errors
        }
        process.exit(1);
    }
};
// Run the seed function
seedAdminUser();
//# sourceMappingURL=seed.js.map