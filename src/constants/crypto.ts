export interface TokenConfig {
  PAIR: {
    chain: 'pulsechain' | 'ethereum' | 'solana';
    pairAddress: string;
  };
}

export const TOKEN_CONSTANTS: Record<string, TokenConfig> = {
  PLS: {
    PAIR: {
      pairAddress: '0xe56043671df55de5cdf8459710433c10324de0ae',
      chain: 'pulsechain'
    }
  }
} 