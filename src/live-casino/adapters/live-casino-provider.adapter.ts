export type LiveCasinoGame = {
  gameId: string;
  provider: string;
  name: string;
  category: string;
  enabled: boolean;
  tableId?: string;
};

export type LiveCasinoLaunchInput = {
  userId: string;
  gameId: string;
  currency?: string;
  locale?: string;
};

export type LiveCasinoLaunchResult = {
  sessionId: string;
  launchUrl: string;
  expiresAt?: string;
  providerRef?: string;
};

export type LiveCasinoCallbackPayload = {
  provider: string;
  action: 'bet' | 'settle' | 'cancel';
  txId: string;
  userId: string;
  sessionId?: string;
  gameId?: string;
  amount: number;
  payout?: number;
  currency?: string;
  meta?: Record<string, any>;
};

export abstract class LiveCasinoProviderAdapter {
  abstract readonly provider: string;

  abstract listGames(params: {
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: LiveCasinoGame[]; total: number }>;

  abstract launchGame(input: LiveCasinoLaunchInput): Promise<LiveCasinoLaunchResult>;

  abstract normalizeCallback(payload: any): Promise<LiveCasinoCallbackPayload>;

  abstract getSession(sessionId: string): Promise<any>;

  abstract getBalance(userId: string): Promise<{ balance: number; currency?: string }>;

  health?(): Promise<{ ok: boolean; message?: string }>;
}
