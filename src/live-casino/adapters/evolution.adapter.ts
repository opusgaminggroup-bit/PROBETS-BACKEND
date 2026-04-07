import {
  LiveCasinoCallbackPayload,
  LiveCasinoGame,
  LiveCasinoLaunchInput,
  LiveCasinoLaunchResult,
  LiveCasinoProviderAdapter,
} from './live-casino-provider.adapter';

export class EvolutionAdapter extends LiveCasinoProviderAdapter {
  readonly provider = 'evolution';

  private readonly games: LiveCasinoGame[] = [
    {
      gameId: 'evo-speed-blackjack-1',
      provider: this.provider,
      name: 'Speed Blackjack A',
      category: 'blackjack',
      enabled: true,
      tableId: 'sbj_a',
    },
    {
      gameId: 'evo-lightning-roulette-1',
      provider: this.provider,
      name: 'Lightning Roulette A',
      category: 'roulette',
      enabled: true,
      tableId: 'lr_a',
    },
    {
      gameId: 'evo-baccarat-squeeze-1',
      provider: this.provider,
      name: 'Baccarat Squeeze A',
      category: 'baccarat',
      enabled: true,
      tableId: 'bac_a',
    },
  ];

  async listGames(params: { category?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(params.page ?? 1));
    const limit = Math.max(1, Math.min(200, Number(params.limit ?? 20)));

    const filtered = this.games.filter((g) =>
      params.category ? g.category.toLowerCase() === params.category.toLowerCase() : true,
    );

    const start = (page - 1) * limit;
    return {
      items: filtered.slice(start, start + limit),
      total: filtered.length,
    };
  }

  async launchGame(input: LiveCasinoLaunchInput): Promise<LiveCasinoLaunchResult> {
    const sessionId = `EVO-${input.userId}-${Date.now()}`;
    const base = process.env.EVOLUTION_LAUNCH_URL ?? 'https://example-evolution-launch.local';
    const launchUrl = `${base}?sessionId=${encodeURIComponent(sessionId)}&gameId=${encodeURIComponent(input.gameId)}&userId=${encodeURIComponent(input.userId)}`;

    return {
      sessionId,
      launchUrl,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      providerRef: `evo-ref-${Date.now()}`,
    };
  }

  async normalizeCallback(payload: any): Promise<LiveCasinoCallbackPayload> {
    return {
      provider: this.provider,
      action: payload?.action,
      txId: String(payload?.txId ?? payload?.transactionId ?? ''),
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
    return {
      provider: this.provider,
      sessionId,
      status: 'active',
      heartbeatAt: new Date().toISOString(),
    };
  }

  async getBalance(): Promise<{ balance: number; currency?: string }> {
    return { balance: 0, currency: 'MYR' };
  }

  async health() {
    return { ok: true, message: 'evolution mock adapter healthy' };
  }
}
