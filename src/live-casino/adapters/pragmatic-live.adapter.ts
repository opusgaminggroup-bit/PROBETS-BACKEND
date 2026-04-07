import {
  LiveCasinoCallbackPayload,
  LiveCasinoLaunchInput,
  LiveCasinoLaunchResult,
  LiveCasinoProviderAdapter,
} from './live-casino-provider.adapter';

export class PragmaticLiveAdapter extends LiveCasinoProviderAdapter {
  readonly provider = 'pragmatic-live';

  async listGames(params: { category?: string; page?: number; limit?: number }) {
    return {
      items: [
        {
          gameId: 'ppl-live-blackjack-1',
          provider: this.provider,
          name: 'Pragmatic Live Blackjack A',
          category: params.category ?? 'blackjack',
          enabled: true,
        },
      ],
      total: 1,
    };
  }

  async launchGame(input: LiveCasinoLaunchInput): Promise<LiveCasinoLaunchResult> {
    const sessionId = `PPL-${input.userId}-${Date.now()}`;
    const launchBase = process.env.PRAGMATIC_LIVE_LAUNCH_URL ?? 'https://example-pragmatic-launch.local';
    return {
      sessionId,
      launchUrl: `${launchBase}?sessionId=${encodeURIComponent(sessionId)}&gameId=${encodeURIComponent(input.gameId)}`,
      providerRef: `ppl-${Date.now()}`,
    };
  }

  async normalizeCallback(payload: any): Promise<LiveCasinoCallbackPayload> {
    return {
      provider: this.provider,
      action: payload?.action,
      txId: String(payload?.txId ?? ''),
      userId: String(payload?.userId ?? ''),
      sessionId: payload?.sessionId ? String(payload.sessionId) : undefined,
      gameId: payload?.gameId ? String(payload.gameId) : undefined,
      amount: Number(payload?.amount ?? 0),
      payout: payload?.payout != null ? Number(payload.payout) : undefined,
      currency: payload?.currency ? String(payload.currency) : 'MYR',
      meta: payload ?? {},
    };
  }

  async getSession(sessionId: string): Promise<any> {
    return { provider: this.provider, sessionId, status: 'active' };
  }

  async getBalance() {
    return { balance: 0, currency: 'MYR' };
  }

  async health() {
    return { ok: true, message: 'pragmatic-live stub adapter healthy' };
  }
}
