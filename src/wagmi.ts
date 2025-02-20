import { http, createConfig } from 'wagmi'
import { Chain, defineChain } from 'viem'
import { injected } from 'wagmi/connectors'

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
    default: { http: ['https://rpc.pulsechain.com'] },
    public: { http: ['https://rpc.pulsechain.com'] },
  },
  blockExplorers: {
    default: { name: 'PulseScan', url: 'https://scan.pulsechain.com' },
  },
})

export const config = createConfig({
  chains: [pulsechain],
  connectors: [
    injected(),
  ],
  transports: {
    [pulsechain.id]: http('https://rpc.pulsechain.com'),
  },
  ssr: true,
  syncConnectedChain: true,
}) 