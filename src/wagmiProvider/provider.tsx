"use client";
import React, { useEffect } from "react";
import { config } from "./config";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      // Simple config check
      console.log('Wagmi Provider Mounted');
      console.log('Chain Config:', config.chains[0]);
      console.log('Transport Config:', config.transports);
    } catch (error) {
      console.error('Error logging config:', error);
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectionStatus />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Component to monitor connection status
function ConnectionStatus() {
  useEffect(() => {
    console.log('Connection Status component mounted');
    
    // Log initial chain configuration
    const chainConfig = config.chains[0];
    console.log('Initial chain config:', {
      id: chainConfig.id,
      name: chainConfig.name,
      rpcUrl: chainConfig.rpcUrls.default.http[0],
    });

  }, []);

  return null;
}
