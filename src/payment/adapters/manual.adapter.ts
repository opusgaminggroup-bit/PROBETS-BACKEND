import { PaymentCreateInput, PaymentProviderAdapter } from './payment-provider.adapter';

export class ManualAdapter extends PaymentProviderAdapter {
  readonly provider = 'manual';

  async createOrder(input: PaymentCreateInput) {
    return {
      provider: this.provider,
      channelRef: `MANUAL-${Date.now()}`,
      status: 'pending' as const,
      message: `Manual review required for ${input.type}`,
      meta: input.meta ?? {},
    };
  }

  async handleCallback(payload: any) {
    return {
      orderNo: String(payload?.orderNo ?? ''),
      status: String(payload?.status ?? 'pending'),
      txHash: payload?.txHash ? String(payload.txHash) : undefined,
      meta: payload ?? {},
    };
  }
}
