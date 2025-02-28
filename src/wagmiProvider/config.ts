import { http, createConfig } from "wagmi";
import { pulsechain } from "./chainConfig";

export const config = createConfig({
  chains: [pulsechain],
  transports: {
    [pulsechain.id]: http(),
  },
  syncConnectedChain: true,
  ssr: true,
});
