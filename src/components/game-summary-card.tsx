import { Card, CardContent } from "@/components/ui/card";
import { useCryptoPrice } from '@/hooks/use-crypto-price';
import { useGameState } from '@/hooks/use-game-state';
import { useRouter } from 'next/navigation';

interface GameSummaryCardProps {
  gameId: number;
  events: any[];
  onSelect: (gameId: string) => void;
  contract: any;
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
  contract
}: GameSummaryCardProps) {
  const { priceData } = useCryptoPrice('PLS');
  const { isActive, isLoading } = useGameState(contract, gameId);
  const router = useRouter();
  
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

  // Find the owner of a ticket number
  const findTicketOwner = (ticketNumber: number) => {
    let currentTotal = 0;
    for (const event of sortedEvents) {
      const newTotal = currentTotal + Number(event.numEntries);
      if (ticketNumber <= newTotal) {
        return event.entrant;
      }
      currentTotal = newTotal;
    }
    return null;
  };

  // Handle winning ticket click
  const handleTicketClick = (e: React.MouseEvent, ticketNumber: number) => {
    e.stopPropagation(); // Prevent card click from triggering
    const owner = findTicketOwner(ticketNumber);
    if (owner) {
      onSelect(gameId.toString());
      router.push(`?address=${owner}`, { scroll: false });
      
      // Wait for the next tick to ensure DOM is updated
      setTimeout(() => {
        const heatmapSection = document.getElementById('tickets-heatmap');
        if (heatmapSection) {
          heatmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <Card 
      className={`bg-black border rounded-[15px] cursor-pointer transition-all duration-300 ${
        isActive 
          ? 'border-[#55FF9F]/60 hover:border-[#55FF9F]' 
          : 'border-white/20 hover:border-white/40'
      }`}
      onClick={() => onSelect(gameId.toString())}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-white">Game {gameId}</h3>
              <div className="text-white/40 text-sm">{durationInDays} days</div>
            </div>
            {isActive ? (
              <span className="text-[#55FF9F] text-sm bg-[#55FF9F]/10 px-2 py-1 rounded-full">Active</span>
            ) : (
              <span className="text-white/40 text-sm bg-white/20 px-2 py-1 rounded-full">Complete</span>
            )}
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
            <p className="text-sm text-white/40 mb-2">{isActive ? "Potential Winning Tickets" : "Winning Tickets"}</p>
            <div className="flex flex-wrap gap-2">
              {winningTickets.map((ticket, index) => (
                <span 
                  key={index}
                  onClick={(e) => handleTicketClick(e, ticket)}
                  className="relative px-2 py-1 bg-white/10 rounded-full text-sm text-white cursor-pointer transition-all duration-500 hover:bg-[#8E34EA]/60 hover:border-[#994ee3] hover:text-white border border-transparent overflow-hidden group"
                >
                  <span className="relative z-10">#{formatNumber(ticket)}</span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#8E34EA]/40 to-transparent animate-shimmer" style={{animationDuration: '1s'}} />
                  </div>
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 