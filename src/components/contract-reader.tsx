'use client';

import { useContractRead, useWatchContractEvent, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { formatEther, parseAbiItem, type Log } from 'viem';
import { Card, CardContent } from "@/components/ui/card";
import { EntriesTable } from './entries-table';
import PrizePoolChart from './prize-pool-chart';
import { useCryptoPrice } from '@/hooks/use-crypto-price';

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
  const publicClient = usePublicClient();
  const { priceData } = useCryptoPrice('PLS');

  // Read number of winners for current game
  const { data: numWinners, isError: winnersError, isLoading: winnersLoading } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getNumWinners',
    args: [BigInt(gameId)],
  });

  // Fetch all historical events
  useEffect(() => {
    async function fetchHistoricalEvents() {
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

        console.log('Raw logs from blockchain:', logs);

        const formattedEvents = logs.map((log) => {
          const args = (log as any).args; // Type assertion since we know the structure
          console.log('Processing log:', log);
          console.log('Log args:', args);
          
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

        console.log('Formatted events:', formattedEvents);
        setEvents(formattedEvents);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching historical events:', error);
        setIsLoading(false);
      }
    }

    fetchHistoricalEvents();
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

  if (winnersError) {
    return <div className="text-red-500">Error loading contract data</div>;
  }

  return (
    <div className="relative py-4">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <p className="text-3xl font-bold text-white">{formatNumber(gameId)}</p>
                  <div className="text-sm text-white/40">Current Game</div>
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
                    {events.length === 0 ? '0' : (() => {
                      // Create a map to store total entries per address
                      const entriesPerAddress = events.reduce((acc, event) => {
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
                      const average = totalEntries / totalAddresses;
                      
                      return formatNumber(Math.round(average));
                    })()}
                  </p>
                  <div className="text-sm text-white/40">Per Address</div>
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
                <p className="text-sm text-white/40">Total Prize Pool</p>
                <div className="flex flex-col">
                  <p className="text-3xl font-bold text-white">{formatNumber(events[0]?.prizePool || 0)} PLS</p>
                  <p className="text-lg text-white/60">${formatNumber(events[0]?.prizePool * (priceData?.price || 0) || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Prize Pool Chart */}
      <PrizePoolChart events={events} isLoading={isLoading} />

      {/* Entries Table */}
      <EntriesTable entries={eventsWithTickets} isLoading={isLoading} />
    </div>
  );
} 