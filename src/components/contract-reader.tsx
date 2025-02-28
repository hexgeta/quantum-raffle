'use client';

import { useContractRead, useWatchContractEvent, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { formatEther, parseAbiItem, type Log } from 'viem';
import { Card, CardContent } from "@/components/ui/card";
import { EntriesTable } from './entries-table';
import PrizePoolChart from './prize-pool-chart';
import EntrantsChart from './entrants-chart';
import EarlyEntrantsChart from './early-entrants-chart';
import AdoptionBonusChart from './adoption-bonus-chart';
import TicketsHeatmapChart from './tickets-heatmap-chart';
import { useCryptoPrice } from '@/hooks/use-crypto-price';
import { GameSummaryGrid } from './game-summary-grid';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const CONTRACT_ADDRESS = '0x165BAD87E3eF9e1F4FB9b384f2BD1FaBDc414f17';

const CONTRACT_ABI = [
  {
    "inputs": [{"name": "gameId", "type": "uint256"}],
    "name": "getNumWinners",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function",
    "stateMutability": "view"
  },
  {
    "inputs": [{"name": "gameId", "type": "uint256"}],
    "name": "isGameOver",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function",
    "stateMutability": "view"
  },
  {
    "inputs": [
      {"name": "_gameId", "type": "uint256"},
      {"name": "_cohortId", "type": "uint256"}
    ],
    "name": "getAdoptionBonusPrizePerTeam",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function",
    "stateMutability": "view"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "gameId", "type": "uint256"},
      {"indexed": true, "name": "entrant", "type": "address"},
      {"indexed": false, "name": "entryAmount", "type": "uint256"},
      {"indexed": false, "name": "entrantCount", "type": "uint256"},
      {"indexed": false, "name": "timestamp", "type": "uint256"},
      {"indexed": false, "name": "num_winners", "type": "uint256"},
      {"indexed": false, "name": "prizePool", "type": "uint256"},
      {"indexed": false, "name": "num_entries", "type": "uint256"}
    ],
    "name": "GameEntered",
    "type": "event"
  }
] as const;

interface Entry {
  gameId: number;
  blockNumber: number;
  timestamp: string;
  ticketNumber: number;
  entrant: string;
  entryAmount: string;
  prizePool: string;
  numEntries: number;
  transactionHash: string;
}

// Helper function to format numbers with commas
const formatNumber = (value: number | string) => {
  return Number(value).toLocaleString('en-US', {
    maximumFractionDigits: 0
  });
};

export default function ContractReader() {
  console.log('ContractReader mounting');
  
  const [gameId, setGameId] = useState<number>(1);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const publicClient = usePublicClient();
  const { priceData } = useCryptoPrice('PLS');

  // Read number of winners (which equals number of digits in total entries)
  const { data: numWinners, isError: winnersError, isLoading: winnersLoading } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getNumWinners',
    args: [BigInt(selectedGame === "all" ? 1 : selectedGame || 1)],
  });

  // Read adoption bonus prize for current game
  const { data: adoptionBonus, isError: adoptionError } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAdoptionBonusPrizePerTeam',
    args: [
      BigInt(selectedGame === "all" ? 1 : selectedGame || 1),
      BigInt(numWinners ? (Number(numWinners) === 1 ? 2 : Number(numWinners)) : 2)
    ],
  });

  // Log adoption bonus changes
  useEffect(() => {
    console.log('Adoption bonus updated:', {
      selectedGame,
      adoptionBonus: adoptionBonus ? formatEther(adoptionBonus) : null,
      error: adoptionError
    });
  }, [selectedGame, adoptionBonus, adoptionError]);

  // Get contract instance
  const contract = {
    isGameOver: async (gameId: number) => {
      try {
        if (!publicClient) {
          console.log('No public client available');
          return true;
        }
        
        const isOver = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'isGameOver',
          args: [BigInt(gameId)]
        });
        
        return isOver;
      } catch (error) {
        console.error('Error checking game state:', error);
        // If we can't read the state, assume it's complete for safety
        return true;
      }
    }
  };

  // Fetch all historical events and check active game
  useEffect(() => {
    async function initialize() {
      try {
        console.log('Fetching historical events...');
        
        if (!publicClient) {
          console.log('Public client not ready');
          return;
        }

        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: parseAbiItem('event GameEntered(uint256 indexed gameId, address indexed entrant, uint256 entryAmount, uint256 entrantCount, uint256 timestamp, uint256 num_winners, uint256 prizePool, uint256 num_entries)'),
          fromBlock: BigInt(0),
          toBlock: 'latest'
        });

        const formattedEvents = logs.map((log) => {
          const args = (log as any).args;
          return {
            gameId: Number(args.gameId),
            entrant: args.entrant,
            entryAmount: formatEther(args.entryAmount || BigInt(0)),
            entrantCount: Number(args.entrantCount),
            timestamp: new Date(Number(args.timestamp) * 1000).toLocaleString(),
            numWinners: Number(args.num_winners),
            prizePool: formatEther(args.prizePool || BigInt(0)),
            numEntries: Number(args.num_entries),
            transactionHash: log.transactionHash,
            blockNumber: Number(log.blockNumber)
          };
        });

        setEvents(formattedEvents);

        // Get unique game IDs sorted by most recent first
        const gameIds = [...new Set(formattedEvents.map(event => event.gameId))]
          .sort((a, b) => b - a);
        
        // Default to most recent game
        let defaultGame = gameIds[0]?.toString() || "1";

        // Check each game starting from the most recent
        for (const gameId of gameIds) {
          try {
            const isOver = await contract.isGameOver(gameId);
            if (!isOver) {
              // Found an active game, use this instead
              defaultGame = gameId.toString();
              break;
            }
          } catch (error) {
            console.error(`Error checking game ${gameId}:`, error);
          }
        }

        setSelectedGame(defaultGame);
        setIsLoading(false);
        setHasInitialized(true);
      } catch (error) {
        console.error('Error initializing:', error);
        setSelectedGame("all"); // Fallback to all games on error
        setIsLoading(false);
        setHasInitialized(true);
      }
    }

    initialize();
  }, [publicClient]);

  // Watch for new events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'GameEntered',
    onLogs(logs) {
      console.log('New event logs received:', logs);
      const newEvents = logs.map(log => ({
        gameId: Number(log.args.gameId),
        entrant: log.args.entrant,
        entryAmount: formatEther(log.args.entryAmount || BigInt(0)),
        entrantCount: Number(log.args.entrantCount),
        timestamp: new Date(Number(log.args.timestamp) * 1000).toLocaleString(),
        numWinners: Number(log.args.num_winners),
        prizePool: formatEther(log.args.prizePool || BigInt(0)),
        numEntries: Number(log.args.num_entries),
        transactionHash: log.transactionHash,
        blockNumber: Number(log.blockNumber)
      }));
      console.log('Formatted new events:', newEvents);
      setEvents(prev => [...newEvents, ...prev]);
    },
  });

  // Sort and add ticket numbers to events
  const eventsWithTickets = events
    .sort((a, b) => b.blockNumber - a.blockNumber) // Sort by block number in descending order
    .reduce((acc, event) => {
      // Get the next ticket number (start from the last ticket number in acc, or total entries if acc is empty)
      const lastTicketNumber = acc.length > 0 ? 
        acc[acc.length - 1].startTicketNumber - 1 : 
        events[0].numEntries;

      // For each event, create an array of entries based on numEntries
      const entries = Array.from({ length: event.numEntries }, (_, i) => ({
        ...event,
        startTicketNumber: lastTicketNumber,
        ticketNumber: lastTicketNumber - i
      }));

      return [...acc, ...entries];
    }, []);

  // Calculate total entries
  const totalEntries = events.length > 0 ? events[0].numEntries : 0;

  // Filter events for selected game
  const filteredEvents = selectedGame === "all" 
    ? events 
    : events.filter(event => event.gameId.toString() === selectedGame);

  // Filter tickets for selected game
  const filteredTickets = selectedGame === "all"
    ? eventsWithTickets
    : eventsWithTickets.filter((event: Entry) => event.gameId.toString() === selectedGame);

  // Add loading state check
  const isInitializing = isLoading || !hasInitialized || selectedGame === null;

  // Loading state UI
  if (isInitializing) {
    return (
      <div className="space-y-4">
        {/* Stats Cards Loading State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-black border border-white/20 rounded-[15px]">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-white/10 rounded animate-pulse mt-2" />
                  <div className="h-6 w-24 bg-white/10 rounded animate-pulse mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Prize Pool Chart Loading State */}
        <div className="w-full h-[450px] relative py-4">
          <div className="w-full h-full p-5 border border-white/20 rounded-[15px]">
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-8 ml-10" />
            <div className="w-full h-[300px] flex items-end px-10">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-white/10 rounded-t mx-1 animate-pulse"
                  style={{ height: `${60 - (i * 15)}%` }} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Entrants Chart Loading State */}
        <div className="w-full h-[450px] relative py-4">
          <div className="w-full h-full p-5 border border-white/20 rounded-[15px]">
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-8 ml-10" />
            <div className="w-full h-[300px] flex items-end px-10">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-white/10 rounded-t mx-1 animate-pulse"
                  style={{ height: `${60 - (i * 15)}%` }} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Table Loading State */}
        <div className="w-full py-4 px-1 xs:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-[180px] h-10 bg-white/10 rounded-[100px] animate-pulse" />
            <div className="relative flex-1 max-w-md h-10 bg-white/10 rounded-[400px] animate-pulse" />
          </div>
          <div className="rounded-lg border border-white/20 rounded-[15px] overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="border-b border-[#333] p-4">
                  <div className="grid grid-cols-9 gap-4">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="h-4 bg-white/10 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border-b border-[#333] p-4">
                    <div className="grid grid-cols-9 gap-4">
                      {[...Array(9)].map((_, j) => (
                        <div key={j} className="h-8 bg-white/10 rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (winnersError) {
    return <div className="text-red-500">Error loading contract data</div>;
  }

  // Handle game selection
  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId);
    // If we're in the same shell, scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      {/* Game Selection Dropdown */}
      <div className="flex items-center gap-4">
        <div className="relative w-[180px]">
          <Select
            value={selectedGame}
            onValueChange={handleGameSelect}
          >
            <SelectTrigger className="w-full h-10 bg-black text-white border-white/20 rounded-[100px] flex items-center">
              <SelectValue placeholder="Select Game" />
            </SelectTrigger>
            <SelectContent 
              position="popper" 
              className="bg-black text-white border-white/20 min-w-[180px] w-[var(--radix-select-trigger-width)]"
              align="start"
              sideOffset={4}
            >
              <SelectItem value="all">All Games</SelectItem>
              {[...new Set(events.map(event => event.gameId))]
                .sort((a, b) => a - b)
                .map((gameId) => (
                  <SelectItem key={gameId} value={gameId.toString()}>
                    Game {gameId}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedGame !== "all" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Game ID Card */}
          {isLoading ? (
            <Card className="bg-black border border-white/20 rounded-[15px]">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-white/10 rounded animate-pulse mt-2" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black border border-white/20 rounded-[15px]">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <p className="text-sm text-white/40">Game ID</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-white">{selectedGame === "all" ? "-" : selectedGame}</p>
                    <div className="text-sm text-white/40"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Average Tickets per Entrant Card */}
          {isLoading ? (
            <Card className="bg-black border border-white/20 rounded-[15px]">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-white/10 rounded animate-pulse mt-2" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black border border-white/20 rounded-[15px]">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <p className="text-sm text-white/40">Avg. Tickets/Entrant</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-white">
                      {(() => {
                        // Create a map to store total entries per address
                        const entriesPerAddress = filteredEvents.reduce((acc, event) => {
                          acc.set(
                            event.entrant, 
                            (acc.get(event.entrant) || 0) + Number(event.numEntries)
                          );
                          return acc;
                        }, new Map<string, number>());
                        
                        // Calculate average entries per address
                        const totalAddresses = entriesPerAddress.size;
                        const values = Array.from(entriesPerAddress.values()) as number[];
                        const totalEntries = values.reduce((a, b) => a + b, 0);
                        const average = totalAddresses > 0 ? totalEntries / totalAddresses : 0;
                        
                        return formatNumber(Math.round(average));
                      })()}
                    </p>
                    <div className="text-sm text-white/40"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Total Tickets Card */}
          {isLoading ? (
            <Card className="bg-black border border-white/20 rounded-[15px]">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-white/10 rounded animate-pulse mt-2" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black border border-white/20 rounded-[15px]">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <p className="text-sm text-white/40">Total Tickets</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-white">
                      {formatNumber(filteredEvents.reduce((sum, event) => sum + Number(event.numEntries), 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Total Prize Pool Card */}
          {isLoading ? (
            <Card className="bg-black border border-white/20 rounded-[15px]">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-white/10 rounded animate-pulse mt-2" />
                  <div className="h-6 w-24 bg-white/10 rounded animate-pulse mt-2" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black border border-white/20 rounded-[15px]">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <p className="text-sm text-white/40">Grand Prize Pool</p>
                  <div className="flex flex-col">
                    <p className="text-3xl font-bold text-white">{formatNumber(Number(filteredEvents[0]?.prizePool || 0))} PLS</p>
                    <p className="text-lg text-white/60">${formatNumber(Number(filteredEvents[0]?.prizePool || 0) * (priceData?.price || 0))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prize Per Winner Card */}
          {isLoading ? (
            <Card className="bg-black border border-white/20 rounded-[15px]">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-white/10 rounded animate-pulse mt-2" />
                  <div className="h-6 w-24 bg-white/10 rounded animate-pulse mt-2" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black border border-white/20 rounded-[15px]">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <p className="text-sm text-white/40">Grand Prize Per Winner</p>
                  <div className="flex flex-col">
                    {(() => {
                      // Get the prize pool and numWinners from the contract data
                      const prizePool = Number(filteredEvents[0]?.prizePool || 0);
                      
                      // Use the numWinners value from the contract data
                      // This is already being read from the contract in the useContractRead hook
                      const winnerCount = Number(numWinners || 1);
                      
                      // Calculate prize per winner
                      const prizePerWinner = prizePool / winnerCount;
                      
                      return (
                        <>
                          <p className="text-3xl font-bold text-white">{formatNumber(prizePerWinner)} PLS</p>
                          <p className="text-lg text-white/60">${formatNumber(prizePerWinner * (priceData?.price || 0))}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Adoption Bonus Prize Pool Card */}
          {selectedGame !== "all" && (isLoading ? (
            <Card className="bg-black border border-white/20 rounded-[15px]">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-white/10 rounded animate-pulse mt-2" />
                  <div className="h-6 w-24 bg-white/10 rounded animate-pulse mt-2" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black border border-white/20 rounded-[15px]">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <p className="text-sm text-white/40">Adoption Bonus Pool</p>
                  <div className="flex flex-col">
                    {(() => {
                      // Calculate total deposits for this game
                      const totalDeposits = filteredEvents.reduce((sum, event) => 
                        sum + Number(event.entryAmount), 0
                      );
                      // Adoption bonus is 20% of total deposits (1/5)
                      const adoptionBonus = totalDeposits / 5;
                      
                      return (
                        <>
                          <p className="text-3xl font-bold text-white">{formatNumber(adoptionBonus)} PLS</p>
                          <p className="text-lg text-white/60">${formatNumber(adoptionBonus * (priceData?.price || 0))}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedGame === "all" ? (
        <GameSummaryGrid 
          events={events}
          onGameSelect={handleGameSelect}
          contract={contract}
        />
      ) : (
        <>
          <PrizePoolChart events={filteredEvents} isLoading={isLoading} />
          <EntrantsChart events={filteredEvents} isLoading={isLoading} />
          <EarlyEntrantsChart events={filteredEvents} isLoading={isLoading} />
          <TicketsHeatmapChart events={filteredEvents} isLoading={isLoading} onAddressSelect={(address) => {
            // This will be called when clearing the search
            // It will propagate to all charts since they use the URL parameter
          }} />
          {/* <AdoptionBonusChart events={filteredEvents} isLoading={isLoading} /> */}
        </>
      )}

      <EntriesTable 
        entries={filteredTickets}
        isLoading={isLoading} 
        contract={contract}
        onGameSelect={handleGameSelect}
        selectedGame={selectedGame}
        onAddressSelect={(address) => {
          // This will be called when clearing the search
          // It will propagate to all charts since they use the URL parameter
        }}
      />
    </div>
  );
} 