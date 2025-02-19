"use client";
import ContractReader from "@/components/contract-reader";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Quantum Raffle Analytics</h1>
        <ContractReader />
      </div>
    </main>
  );
}
