"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = __importDefault(require("./index"));
const logger_1 = __importDefault(require("../utils/logger"));
class Database {
    static instance;
    isConnected = false;
    constructor() { }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
        if (this.isConnected) {
            logger_1.default.info('Database already connected');
            return;
        }
        try {
            mongoose_1.default.set('strictQuery', true);
            mongoose_1.default.connection.on('connected', () => {
                logger_1.default.info('MongoDB connected successfully');
                this.isConnected = true;
            });
            mongoose_1.default.connection.on('error', (error) => {
                logger_1.default.error('MongoDB connection error:', error);
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('disconnected', () => {
                logger_1.default.warn('MongoDB disconnected');
                this.isConnected = false;
            });
            // Graceful shutdown
            process.on('SIGINT', async () => {
                await this.disconnect();
                process.exit(0);
            });
            await mongoose_1.default.connect(index_1.default.mongodb.uri, index_1.default.mongodb.options);
        }
        catch (error) {
            logger_1.default.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose_1.default.connection.close();
            this.isConnected = false;
            logger_1.default.info('MongoDB connection closed');
        }
        catch (error) {
            logger_1.default.error('Error closing MongoDB connection:', error);
            throw error;
        }
    }
    getConnectionStatus() {
        return this.isConnected;
    }
}
exports.default = Database.getInstance();
//# sourceMappingURL=database.js.map