import { createConfig, http } from 'wagmi';
import { pulsechain } from './chainConfig';
import { createPublicClient, http as viemHttp } from 'viem';

export const config = createConfig({
  chains: [pulsechain],
  transports: {
    [pulsechain.id]: http('https://rpc.pulsechain.com'),
  },
  syncConnectedChain: true,
  ssr: true,
});
