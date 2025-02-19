import { createConfig, http } from 'wagmi';
import { pulsechain } from './chainConfig';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [pulsechain],
  connectors: [
    injected(),
  ],
  transports: {
    [pulsechain.id]: http('https://rpc.pulsechain.com'),
  },
});
