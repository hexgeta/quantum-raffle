'use client';

import { useContractRead, useWatchContractEvent, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { formatEther, parseAbiItem, Log } from 'viem';

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

        const formattedEvents = logs.map((log: Log) => {
          const args = log.args as any; // Type assertion since we know the structure
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

  if (winnersError) {
    return <div className="text-red-500">Error loading contract data</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Current Game Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Game ID</h3>
            <p className="text-2xl">{gameId}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Number of Winners</h3>
            <p className="text-2xl">{winnersLoading ? 'Loading...' : numWinners?.toString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Recent Game Entries</h2>
        {isLoading ? (
          <div className="text-center py-4">Loading past events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-4">No events found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-2 text-left">Block</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Entrant</th>
                  <th className="px-4 py-2 text-left">Entry Amount</th>
                  <th className="px-4 py-2 text-left">Prize Pool</th>
                  <th className="px-4 py-2 text-left">Entries</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={event.transactionHash + index} className="border-b border-gray-700">
                    <td className="px-4 py-2">{event.blockNumber}</td>
                    <td className="px-4 py-2">{event.timestamp}</td>
                    <td className="px-4 py-2">{`${event.entrant.slice(0, 6)}...${event.entrant.slice(-4)}`}</td>
                    <td className="px-4 py-2">{event.entryAmount} PLS</td>
                    <td className="px-4 py-2">{event.prizePool} PLS</td>
                    <td className="px-4 py-2">{event.numEntries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 