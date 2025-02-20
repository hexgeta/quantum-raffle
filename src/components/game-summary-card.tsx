import { Card, CardContent } from "@/components/ui/card";
import { useCryptoPrice } from '@/hooks/use-crypto-price';

interface GameSummaryCardProps {
  gameId: number;
  events: any[];
  onSelect: (gameId: string) => void;
  isActive: boolean;
}

// Helper function to format numbers with commas
const formatNumber = (value: number | string) => {
  return Number(value).toLocaleString('en-US', {
    maximumFractionDigits: 0
  });
};

export function GameSummaryCard({ 
  gameId,
  events,
  onSelect,
  isActive
}: GameSummaryCardProps) {
  const { priceData } = useCryptoPrice('PLS');
  
  // Get game events
  const gameEvents = events.filter(event => event.gameId === gameId);
  
  // Sort events by timestamp
  const sortedEvents = [...gameEvents].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const startTime = sortedEvents[0]?.timestamp;
  const endTime = isActive ? undefined : sortedEvents[sortedEvents.length - 1]?.timestamp;
  
  // Calculate duration in days
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const durationInDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get latest prize pool from the most recent event
  const latestEvent = sortedEvents[sortedEvents.length - 1];
  const prizePool = latestEvent?.prizePool || "0";

  // Calculate total entries by summing numEntries from all events
  const totalEntries = gameEvents.reduce((sum, event) => sum + Number(event.numEntries), 0);

  // Calculate average tickets per wallet using the same logic as contract-reader
  const avgTicketsPerWallet = gameEvents.length === 0 ? 0 : (() => {
    // Create a map to store total entries per address
    const entriesPerAddress = gameEvents.reduce((acc, event) => {
      acc.set(
        event.entrant, 
        (acc.get(event.entrant) || 0) + Number(event.numEntries)
      );
      return acc;
    }, new Map<string, number>());
    
    // Calculate average entries per address
    const totalAddresses = entriesPerAddress.size;
    const values = Array.from(entriesPerAddress.values()) as number[];
    const totalTickets = values.reduce((a, b) => a + b, 0);
    return totalAddresses > 0 ? totalTickets / totalAddresses : 0;
  })();

  // Calculate winning ticket numbers
  const winningTickets = [
    totalEntries,           // Last ticket
    totalEntries - 9,       // 10th from last
    totalEntries - 99,      // 100th from last
    totalEntries - 999      // 1000th from last
  ].filter(ticket => ticket > 0);  // Only show valid ticket numbers

  return (
    <Card 
      className={`bg-black border ${isActive ? 'border-[#55FF9F]' : 'border-white/20'} rounded-[15px] cursor-pointer transition-all duration-300 hover:border-white/40`}
      onClick={() => onSelect(gameId.toString())}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-white">Game {gameId}</h3>
              {isActive ? (
                <span className="text-[#55FF9F] text-sm bg-[#55FF9F]/10 px-2 py-1 rounded-full">Active</span>
              ) : (
                <span className="text-white/40 text-sm bg-white/20 px-2 py-1 rounded-full">Complete</span>
              )}
            </div>
            <div className="text-white/40 text-sm">{durationInDays} days</div>
          </div>

          {/* Prize Pool */}
          <div>
            <p className="text-sm text-white/40 mb-1">Prize Pool</p>
            <p className="text-xl font-bold text-white">{formatNumber(prizePool)} PLS</p>
            <p className="text-white/60">${formatNumber(Number(prizePool) * (priceData?.price || 0))}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-white/40 mb-1">Tickets Sold</p>
              <p className="text-lg font-bold text-white">{formatNumber(totalEntries)}</p>
            </div>
            <div>
              <p className="text-sm text-white/40 mb-1">Avg. Tickets/Entrant</p>
              <p className="text-lg font-bold text-white">{formatNumber(Math.round(avgTicketsPerWallet))}</p>
            </div>
          </div>

          {/* Winning Tickets */}
          <div>
            <p className="text-sm text-white/40 mb-2">Winning Tickets</p>
            <div className="flex flex-wrap gap-2">
              {winningTickets.map((ticket, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-white/10 rounded-md text-sm text-white"
                >
                  #{formatNumber(ticket)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 