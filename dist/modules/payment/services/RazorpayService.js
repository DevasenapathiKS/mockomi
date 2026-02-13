"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const razorpay_1 = __importDefault(require("razorpay"));
const env_1 = require("../../../config/env");
class RazorpayService {
    constructor() {
        this.client = new razorpay_1.default({
            key_id: env_1.config.razorpayKeyId,
            key_secret: env_1.config.razorpayKeySecret,
        });
    }
    async createOrder(amount) {
        const amountPaise = Math.round(amount * 100);
        if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
            throw new Error('Invalid amount');
        }
        const order = await this.client.orders.create({
            amount: amountPaise,
            currency: 'INR',
            payment_capture: true,
        });
        return {
            id: order.id,
            amount: Number(order.amount),
            currency: String(order.currency),
            status: String(order.status),
            receipt: order.receipt ? String(order.receipt) : undefined,
        };
    }
    verifySignature(orderId, paymentId, signature) {
        const expected = node_crypto_1.default
            .createHmac('sha256', env_1.config.razorpayKeySecret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');
        const a = Buffer.from(expected, 'utf8');
        const b = Buffer.from(signature, 'utf8');
        if (a.length !== b.length)
            return false;
        return node_crypto_1.default.timingSafeEqual(a, b);
    }
    verifyWebhookSignature(rawBody, signature) {
        const expected = node_crypto_1.default
            .createHmac('sha256', env_1.config.razorpayKeySecret)
            .update(rawBody)
            .digest('hex');
        const a = Buffer.from(expected, 'utf8');
        const b = Buffer.from(signature, 'utf8');
        if (a.length !== b.length)
            return false;
        return node_crypto_1.default.timingSafeEqual(a, b);
    }
}
exports.RazorpayService = RazorpayService;
