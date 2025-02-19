"use client";
import ContractReader from "@/components/contract-reader";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl text-center font-bold text-white">Quantum Raffle Analytics</h1>
      <ContractReader />
    </div>
  );
}
