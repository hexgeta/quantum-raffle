import { type Chain, defineChain } from "viem";

const AUTHORIZED_CHAIN_ID = [9090, 9091];
export const incoNetwork = {
  id: AUTHORIZED_CHAIN_ID[0],
  name: "Inco Gentry Testnet",
  nativeCurrency: { name: "INCO", symbol: "INCO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.inco.org/"] },
  },
  blockExplorers: {
    default: {
      name: "Inco Testnet explorer",
      url: "https://explorer.testnet.inco.org/",
    },
  },
} as const satisfies Chain;

export const pulsechain = defineChain({
  id: 369,
  name: 'PulseChain',
  network: 'pulsechain',
  nativeCurrency: {
    decimals: 18,
    name: 'Pulse',
    symbol: 'PLS',
  },
  rpcUrls: {
    default: { 
      http: ['https://rpc.pulsechain.com'],
      webSocket: ['wss://rpc.pulsechain.com/ws']
    },
    public: { 
      http: ['https://rpc.pulsechain.com'],
      webSocket: ['wss://rpc.pulsechain.com/ws']
    },
  },
  blockExplorers: {
    default: { name: 'PulseScan', url: 'https://scan.pulsechain.com' },
  },
});
