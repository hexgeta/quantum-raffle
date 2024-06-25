import { http, createConfig } from "wagmi";
import { injected, safe, walletConnect, metaMask } from "wagmi/connectors";
import { incoNetwork } from "./chainConfig";
import { sepolia } from "viem/chains";

export const config = createConfig({
  chains: [sepolia, incoNetwork],
  ssr: true,
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.WALLET_CONNECT_PROJECT_ID }),
    metaMask(),
    safe(),
  ],
  transports: {
    // [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
