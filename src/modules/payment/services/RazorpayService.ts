import crypto from 'node:crypto';

import Razorpay from 'razorpay';

import { config } from '../../../config/env';

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
};

export class RazorpayService {
  private readonly client: Razorpay;

  constructor() {
    this.client = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });
  }

  public async createOrder(amount: number): Promise<RazorpayOrder> {
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

  public verifySignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const expected = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  public verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const expected = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(rawBody)
      .digest('hex');

    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}

