export type PaymentCreateInput = {
  type: 'deposit' | 'withdrawal';
  userId: string;
  amount: number;
  currency?: string;
  network?: string;
  walletAddress?: string;
  meta?: Record<string, any>;
};

export type PaymentProviderResult = {
  provider: string;
  channelRef?: string;
  walletAddress?: string;
  status: 'pending' | 'processing' | 'completed';
  message?: string;
  meta?: Record<string, any>;
};

export abstract class PaymentProviderAdapter {
  abstract readonly provider: string;
  abstract createOrder(input: PaymentCreateInput): Promise<PaymentProviderResult>;
  abstract handleCallback(payload: any): Promise<{ orderNo: string; status: string; txHash?: string; meta?: any }>;
}
