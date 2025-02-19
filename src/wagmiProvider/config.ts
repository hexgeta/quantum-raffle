import { createConfig, http } from 'wagmi';
import { pulsechain } from './chainConfig';

export const config = createConfig({
  chains: [pulsechain],
  transports: {
    [pulsechain.id]: http('https://rpc.pulsechain.com'),
  },
});
