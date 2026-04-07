import { PaymentCreateInput, PaymentProviderAdapter } from './payment-provider.adapter';

export class CryptoAdapter extends PaymentProviderAdapter {
  readonly provider = 'crypto';

  async createOrder(input: PaymentCreateInput) {
    const network = input.network ?? process.env.PAYMENT_CRYPTO_NETWORK ?? 'tron';
    const currency = input.currency ?? process.env.PAYMENT_CRYPTO_CURRENCY ?? 'USDT';
    const wallet = process.env.PAYMENT_CRYPTO_RECEIVE_ADDRESS ?? 'TMockWalletAddress123';

    return {
      provider: this.provider,
      channelRef: `CRYPTO-${Date.now()}`,
      walletAddress: wallet,
      status: 'pending' as const,
      message: `Send ${input.amount} ${currency} on ${network}`,
      meta: {
        network,
        currency,
      },
    };
  }

  async handleCallback(payload: any) {
    return {
      orderNo: String(payload?.orderNo ?? ''),
      status: String(payload?.status ?? 'processing'),
      txHash: payload?.txHash ? String(payload.txHash) : undefined,
      meta: payload ?? {},
    };
  }
}
