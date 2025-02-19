"use client";
import ContractReader from "@/components/contract-reader";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <div className="w-full px-4">
        <h1 className="text-4xl font-bold py-8 text-white/80">Quantum Raffle Analytics</h1>
        <ContractReader />
      </div>
    </main>
  );
}
