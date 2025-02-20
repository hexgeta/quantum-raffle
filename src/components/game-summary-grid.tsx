import { GameSummaryCard } from './game-summary-card';
import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface GameSummaryGridProps {
  events: any[];
  onGameSelect: (gameId: string) => void;
  contract: any;
}

export function GameSummaryGrid({ events, onGameSelect, contract }: GameSummaryGridProps) {
  const [activeGames, setActiveGames] = useState<{ [key: number]: boolean }>({});
  const [isCheckingGames, setIsCheckingGames] = useState(true);
  const [previousGameIds, setPreviousGameIds] = useState<number[]>([]);

  // Get unique game IDs
  const gameIds = [...new Set(events.map(event => event.gameId))].sort((a, b) => b - a);

  // Check which games are active
  useEffect(() => {
    let isMounted = true;

    async function checkActiveGames() {
      if (!contract) return;
      
      setIsCheckingGames(true);
      const activeStates: { [key: number]: boolean } = {};
      
      for (const gameId of gameIds) {
        if (!isMounted) break;
        
        try {
          const isOver = await contract.isGameOver(gameId);
          if (isMounted) {
            activeStates[gameId] = !isOver;
          }
        } catch (error) {
          // If the contract call reverts, it means the game is still active
          // This happens because getNumWinners reverts for active games
          console.log('Game', gameId, 'is active (getNumWinners reverted)');
          if (isMounted) {
            activeStates[gameId] = true;
          }
        }
      }
      
      if (isMounted) {
        setActiveGames(activeStates);
        setIsCheckingGames(false);
        setPreviousGameIds(gameIds);
      }
    }

    checkActiveGames();

    return () => {
      isMounted = false;
    };
  }, [gameIds.toString(), contract]); // Only re-run when gameIds or contract changes

  // Use previous game IDs if we're checking games to prevent flashing
  const displayGameIds = isCheckingGames ? previousGameIds : gameIds;

  // Only show loading state on first load
  if (isCheckingGames && previousGameIds.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="bg-black border border-white/20 rounded-[15px]">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                </div>

                {/* Prize Pool */}
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
                  <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                    <div className="h-6 w-16 bg-white/10 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                    <div className="h-6 w-16 bg-white/10 rounded animate-pulse" />
                  </div>
                </div>

                {/* Winning Tickets */}
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                  <div className="flex gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-8 w-20 bg-white/10 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayGameIds.map((gameId) => (
        <GameSummaryCard
          key={gameId}
          gameId={gameId}
          events={events}
          onSelect={onGameSelect}
          contract={contract}
        />
      ))}
    </div>
  );
} 