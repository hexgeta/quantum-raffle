'use client';

import { useContractRead, useWatchContractEvent, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { formatEther, parseAbiItem, type Log } from 'viem';
import { Card, CardContent } from "@/components/ui/card";
import { EntriesTable } from './entries-table';
import PrizePoolChart from './prize-pool-chart';

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

export default function ContractReader() {
  console.log('ContractReader mounting');
  
  const [gameId, setGameId] = useState<number>(1);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

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
    <div className="space-y-6 p-6">
      {/* Stats Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white/80">
          <h2 className="text-2xl font-bold">Quantum Raffle</h2>
          <span className="text-sm opacity-60">STATS</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Game ID Card */}
          <Card className="bg-black/40 border-none">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-white/60">Game ID</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-white">{gameId}</p>
                  <div className="w-px h-4 bg-white/20" />
                  <p className="text-sm text-white/60">Current Game</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Winners Card */}
          <Card className="bg-black/40 border-none">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-white/60">Winners</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-white">
                    {winnersLoading ? 'Loading...' : numWinners?.toString() || '0'}
                  </p>
                  <div className="w-px h-4 bg-white/20" />
                  <p className="text-sm text-white/60">This Round</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Entries Card */}
          <Card className="bg-black/40 border-none">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-white/60">Total Entries</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-white">{totalEntries}</p>
                  <div className="w-px h-4 bg-white/20" />
                  <p className="text-sm text-white/60">Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Prize Pool Chart */}
      <PrizePoolChart events={events} isLoading={isLoading} />

      {/* Entries Table */}
      <EntriesTable entries={eventsWithTickets} isLoading={isLoading} />
    </div>
  );
} 