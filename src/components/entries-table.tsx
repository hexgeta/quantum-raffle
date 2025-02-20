'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useCryptoPrice } from '@/hooks/use-crypto-price';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

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

interface EntriesTableProps {
  entries: Entry[];
  isLoading: boolean;
  contract?: any;
  onGameSelect?: (gameId: string) => void;
  selectedGame: string;
  onAddressSelect?: (address: string) => void;
}

// Helper function to format numbers with commas and decimals
const formatNumber = (value: number | string, decimals: number = 0) => {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const ITEMS_PER_PAGE = 20;

export function EntriesTable({ entries, isLoading, contract, onGameSelect, selectedGame, onAddressSelect }: EntriesTableProps) {
  const [isRendered, setIsRendered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedEntries, setDisplayedEntries] = useState<Entry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { priceData } = useCryptoPrice('PLS');
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get unique game IDs
  const gameIds = [...new Set(entries.map(entry => entry.gameId))].sort((a, b) => a - b);

  // Find the most recent game ID
  const mostRecentGameId = entries.length > 0 
    ? entries.reduce((latest, entry) => {
        const entryDate = new Date(entry.timestamp);
        const latestDate = new Date(latest.timestamp);
        return entryDate > latestDate ? entry : latest;
      }).gameId.toString()
    : "all";

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const maxVisiblePages = 5;

  // Set initial game selection based on active game or most recent
  useEffect(() => {
    const checkActiveGame = async () => {
      if (!hasInitialized && entries.length > 0 && contract) {
        // Check each game starting from the most recent
        for (const gameId of [...gameIds].reverse()) {
          try {
            const isOver = await contract.isGameOver(gameId);
            if (!isOver) {
              onGameSelect?.(gameId.toString());
              setHasInitialized(true);
              return;
            }
          } catch (error) {
            console.error(`Error checking game ${gameId}:`, error);
          }
        }
        // If no active game found, use most recent
        onGameSelect?.(mostRecentGameId);
        setHasInitialized(true);
      }
    };

    checkActiveGame();
  }, [entries, contract, gameIds, mostRecentGameId, onGameSelect, hasInitialized]);

  // Update search query when URL parameter changes
  useEffect(() => {
    const address = searchParams.get('address');
    setSearchQuery(address || '');
  }, [searchParams]);

  // Process and filter entries
  useEffect(() => {
    if (!isLoading && entries.length > 0) {
      // First group entries by game ID
      const entriesByGame = entries.reduce((acc, entry) => {
        const gameId = entry.gameId;
        if (!acc[gameId]) {
          acc[gameId] = [];
        }
        acc[gameId].push(entry);
        return acc;
      }, {} as { [key: number]: typeof entries });

      // For each game, sort entries by timestamp and assign ticket numbers
      let processedEntries: typeof entries = [];
      Object.values(entriesByGame).forEach(gameEntries => {
        // Sort entries within each game by timestamp
        const timeOrderedEntries = [...gameEntries].sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateA.getTime() - dateB.getTime();
        });

        // Assign sequential ticket numbers starting from 1 for each game
        const numberedEntries = timeOrderedEntries.map((entry, index) => ({
          ...entry,
          ticketNumber: index + 1,
          timestamp: new Date(entry.timestamp).toLocaleString('en-US', { 
            timeZone: 'UTC',
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        }));

        processedEntries = [...processedEntries, ...numberedEntries];
      });

      // Then sort all entries by timestamp in descending order for display
      const sortedEntries = processedEntries.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        // First sort by timestamp
        const timeCompare = dateB.getTime() - dateA.getTime();
        // If timestamps are equal, sort by ticket number (higher numbers first)
        if (timeCompare === 0) {
          return b.ticketNumber - a.ticketNumber;
        }
        return timeCompare;
      });

      // Filter based on search query first
      let filtered = searchQuery
        ? searchQuery === "🏆"
          ? sortedEntries.filter(entry => {
              // Get total entries for this specific game
              const gameEntries = entriesByGame[entry.gameId];
              const totalGameEntries = gameEntries.length;
              const ticketNumber = entry.ticketNumber;
              return ticketNumber === totalGameEntries || // Last ticket
                     ticketNumber === totalGameEntries - 9 || // 10th from last
                     ticketNumber === totalGameEntries - 99 || // 100th from last
                     ticketNumber === totalGameEntries - 999; // 1000th from last
            })
          : sortedEntries.filter(entry => 
              entry.entrant.toLowerCase().includes(searchQuery.toLowerCase())
            )
        : sortedEntries;

      // Then filter by game ID if a specific game is selected
      if (selectedGame !== "all") {
        filtered = filtered.filter(entry => entry.gameId === Number(selectedGame));
      }

      setFilteredEntries(filtered);

      // Update displayed entries based on current page
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      setDisplayedEntries(filtered.slice(startIndex, endIndex));
      
      // Add a delay to ensure table is fully rendered
      setTimeout(() => {
        setIsRendered(true);
      }, 500);
    }
  }, [isLoading, entries, currentPage, searchQuery, selectedGame]);

  // Reset rendered state when loading changes
  useEffect(() => {
    if (isLoading) {
      setIsRendered(false);
    }
  }, [isLoading]);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getVisiblePages = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="w-full py-4 px-1 xs:px-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by address / 🏆..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 bg-black text-white border border-white/20 placeholder:text-gray-500 rounded-[400px] command-transition"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                router.push('/', { scroll: false });
                onAddressSelect?.('');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-white/20 rounded-[15px] table-transition overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#333] hover:bg-transparent">
                  <TableHead className="text-gray-400 font-800 text-center">Game ID</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Block</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Time (UTC)</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Ticket #</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Entrant</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Entry Amount</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Total Spent</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Total Prize Pool</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Winners</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoading || !isRendered) ? (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <TableRow key={i} className="border-b border-[#333]">
                        <TableCell className="text-center">
                          <div className="h-4 w-16 bg-white/10 rounded animate-pulse mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-4 w-20 bg-white/10 rounded animate-pulse mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-4 w-32 bg-white/10 rounded animate-pulse mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-4 w-24 bg-white/10 rounded animate-pulse mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-4 w-28 bg-white/10 rounded animate-pulse mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-8 w-20 bg-white/10 rounded animate-pulse mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-8 w-20 bg-white/10 rounded animate-pulse mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-8 w-24 bg-white/10 rounded animate-pulse mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-4 w-16 bg-white/10 rounded animate-pulse mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4 text-white/40">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedEntries.map((entry) => {
                    // Check if this entry is a winning position
                    const totalEntries = entries.length;
                    const isWinner = entry.ticketNumber === totalEntries || // Last ticket
                                   entry.ticketNumber === totalEntries - 9 || // 10th from last
                                   entry.ticketNumber === totalEntries - 99 || // 100th from last
                                   entry.ticketNumber === totalEntries - 999; // 1000th from last

                    // Calculate total spent by this address across all entries
                    const totalSpent = entries
                      .filter(e => e.entrant === entry.entrant)
                      .reduce((sum, e) => sum + Number(e.entryAmount), 0);

                    return (
                      <TableRow 
                        key={`${entry.transactionHash}-${entry.ticketNumber}`}
                        className="border-b border-[#333] hover:bg-[#1a1a1a] cursor-pointer table-transition"
                        onClick={() => window.open(`https://scan.mypinata.cloud/ipfs/bafybeih3olry3is4e4lzm7rus5l3h6zrphcal5a7ayfkhzm5oivjro2cp4/#/tx/${entry.transactionHash}`, '_blank')}
                      >
                        <TableCell className="text-white text-center">{formatNumber(entry.gameId)}</TableCell>
                        <TableCell className="text-white text-center">{formatNumber(entry.blockNumber)}</TableCell>
                        <TableCell className="text-white text-center">{entry.timestamp}</TableCell>
                        <TableCell className="text-white text-center">{formatNumber(entry.ticketNumber)}</TableCell>
                        <TableCell className="text-white text-center">
                          {`${entry.entrant.slice(0, 6)}...${entry.entrant.slice(-4)}`}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-white">
                            {formatNumber(Number(entry.entryAmount) / entry.numEntries, 0)} PLS
                          </div>
                          {priceData?.price && (
                            <div className="text-gray-500">
                              ${formatNumber((Number(entry.entryAmount) / entry.numEntries) * priceData.price, 2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-white">{formatNumber(totalSpent, 0)} PLS</div>
                          {priceData?.price && (
                            <div className="text-gray-500">
                              ${formatNumber(totalSpent * priceData.price, 2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-white">{formatNumber(entry.prizePool)} PLS</div>
                          {priceData?.price && (
                            <div className="text-gray-500">
                              ${formatNumber(Number(entry.prizePool) * priceData.price, 2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-white text-center">{isWinner ? '🏆' : ''}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {!isLoading && entries.length > 0 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={`text-white hover:bg-white/10 ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                />
              </PaginationItem>
              
              {getVisiblePages().map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={currentPage === pageNum}
                    className={`text-white hover:bg-white/10 ${currentPage === pageNum ? 'bg-white/20 border-white/20' : ''}`}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              {getVisiblePages()[getVisiblePages().length - 1] < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis className="text-white" />
                </PaginationItem>
              )}
              
              {getVisiblePages()[getVisiblePages().length - 1] < totalPages && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => setCurrentPage(totalPages)}
                    isActive={currentPage === totalPages}
                    className={`text-white hover:bg-white/10 ${currentPage === totalPages ? 'bg-white/20 border-white/20' : ''}`}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={`text-white hover:bg-white/10 ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
 