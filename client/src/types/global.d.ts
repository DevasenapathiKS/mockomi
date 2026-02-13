export {};

type RazorpayHandler = (response: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}) => void;

type RazorpayInstance = {
  open: () => void;
  close: () => void;
  on: (event: 'payment.failed', handler: (response: unknown) => void) => void;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: RazorpayHandler;
  prefill?: {
    email?: string;
  };
  theme?: {
    color?: string;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
