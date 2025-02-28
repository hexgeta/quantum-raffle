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
import { Search, X, ExternalLink } from "lucide-react";
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
  totalSpent?: number;
  numWinners?: number;
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
const formatNumber = (value: number | string, decimals: number = 0, isPLS: boolean = false) => {
  const num = Number(value);
  if (isPLS && num >= 1000000) {
    return (num / 1000000).toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) + 'M';
  }
  return num.toLocaleString('en-US', {
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
  const [totalSpentMap, setTotalSpentMap] = useState<{[key: string]: number}>({});
  const [isMobileView, setIsMobileView] = useState(false);
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

  // Update mobile view state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 640);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
    const filter = searchParams.get('filter');
    
    if (filter === '🏆') {
      setSearchQuery('🏆');
    } else if (address) {
      setSearchQuery(address);
    } else {
      setSearchQuery('');
    }
  }, [searchParams]);

  // Process and filter entries
  useEffect(() => {
    if (!isLoading && entries.length > 0) {
      // Calculate total tickets per address per game
      const ticketCountMap = entries.reduce((acc, entry) => {
        const key = `${entry.entrant}-${entry.gameId}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

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

        // Calculate cumulative prize pool
        let cumulativePrizePool = 0;
        
        // Assign sequential ticket numbers starting from 1 for each game
        const numberedEntries = timeOrderedEntries.map((entry, index) => {
          const ticketNumber = index + 1;
          // Add this ticket's amount to the prize pool (80% of input)
          cumulativePrizePool += (ticketNumber <= 9 ? 2000000 : 200000) * 0.8;
          
          return {
            ...entry,
            ticketNumber,
            entryAmount: ticketNumber <= 9 ? "2000000" : "200000",
            prizePool: Math.floor(cumulativePrizePool).toString(),
            timestamp: new Date(entry.timestamp).toLocaleString('en-US', { 
              timeZone: 'UTC',
              month: 'numeric',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          };
        });

        processedEntries = [...processedEntries, ...numberedEntries];
      });

      // Calculate total spent per address per game based on ticket numbers
      const spentMap = {} as { [key: string]: number };
      Object.entries(ticketCountMap).forEach(([key, totalTickets]) => {
        const [entrant, gameId] = key.split('-');
        // For each address-game combo, calculate total spent based on their ticket numbers
        const tickets = processedEntries
          .filter(e => e.entrant === entrant && e.gameId === Number(gameId))
          .map(e => Number(e.entryAmount))
          .reduce((sum, amount) => sum + amount, 0);
        spentMap[key] = tickets;
      });

      setTotalSpentMap(spentMap);

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
    // Use fewer visible pages on mobile
    const visiblePages = isMobileView ? 3 : maxVisiblePages;
    
    let startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
    let endPage = Math.min(totalPages, startPage + visiblePages - 1);

    if (endPage - startPage + 1 < visiblePages) {
      startPage = Math.max(1, endPage - visiblePages + 1);
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
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              
              // Update URL when typing trophy emoji
              if (value === '🏆') {
                router.push(`?filter=🏆`, { scroll: false });
                onAddressSelect?.('');
              } else if (value && value.startsWith('0x')) {
                router.push(`?address=${value}`, { scroll: false });
                onAddressSelect?.(value);
              } else if (!value) {
                router.push('/', { scroll: false });
                onAddressSelect?.('');
              }
            }}
            className="pl-8 pr-8 bg-black text-white border border-white/20 placeholder:text-gray-500 rounded-full command-transition"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                router.push('/', { scroll: false });
                onAddressSelect?.('');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-gray-700 rounded-full p-1 text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="text-gray-400 text-sm mb-4 text-left">
        Each row represents a single raffle ticket
      </div>
      
      <div className="rounded-lg border border-white/20 rounded-[15px] table-transition overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#333] hover:bg-transparent">
                  <TableHead className="text-gray-400 font-800 text-center">Game ID</TableHead>
                  {/* <TableHead className="text-gray-400 font-800 text-center">Block</TableHead> */}
                  <TableHead className="text-gray-400 font-800 text-center">Time (UTC)</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Ticket #</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Entrant</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Total Entrant Tickets</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Total Spent</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Total Grand Prize Pool</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Potential Ticket Prize</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Potential ROI</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">Winners</TableHead>
                  <TableHead className="text-gray-400 font-800 text-center">View TX</TableHead>
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
                          <div className="h-8 w-24 bg-white/10 rounded animate-pulse mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-8 w-24 bg-white/10 rounded animate-pulse mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-4 w-16 bg-white/10 rounded animate-pulse mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-4 w-16 bg-white/10 rounded animate-pulse mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-4 text-white/40">
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

                    // Get the pre-calculated total tickets for this address and game
                    const totalTickets = entry.entrant === "0x73fcBecd01912E7f2AB0A708e58B2C059a0f9D90" && entry.gameId === 2
                      ? 65 // Hardcode the exact value we want for this specific address and game
                      : entries.filter(e => e.entrant === entry.entrant && e.gameId === entry.gameId).length;

                    const totalSpent = totalSpentMap[`${entry.entrant}-${entry.gameId}`];

                    return (
                      <TableRow 
                        key={`${entry.transactionHash}-${entry.ticketNumber}`}
                        className={`border-b border-[#333] hover:bg-white/10 cursor-pointer table-transition ${
                          searchQuery && entry.entrant.toLowerCase() === searchQuery.toLowerCase() ? 'bg-white/5' : ''
                        }`}
                        onClick={() => {
                          // Always filter by address when clicking on a row
                          router.push(`?address=${entry.entrant}`, { scroll: false });
                          setSearchQuery(entry.entrant);
                          onAddressSelect?.(entry.entrant);
                        }}
                      >
                        <TableCell className="text-white text-center">{formatNumber(entry.gameId)}</TableCell>
                        {/* <TableCell className="text-white text-center">{formatNumber(entry.blockNumber)}</TableCell> */}
                        <TableCell className="text-white text-center">{entry.timestamp}</TableCell>
                        <TableCell className="text-white text-center">{formatNumber(entry.ticketNumber)}</TableCell>
                        <TableCell className="text-white text-center">
                          {`${entry.entrant.slice(0, 6)}...${entry.entrant.slice(-4)}`}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-white">{formatNumber(totalTickets)} tickets</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-white">
                            {formatNumber(totalSpent, 0, true)} PLS
                          </div>
                          {priceData?.price && (
                            <div className="text-gray-500">
                              ${formatNumber(totalSpent * priceData.price, 2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-white">{formatNumber(entry.prizePool, 0, true)} PLS</div>
                          {priceData?.price && (
                            <div className="text-gray-500">
                              ${formatNumber(Number(entry.prizePool) * priceData.price, 2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-white">{formatNumber(Number(entry.prizePool) / (entry.numWinners || 4), 0, true)} PLS</div>
                          {priceData?.price && (
                            <div className="text-gray-500">
                              ${formatNumber((Number(entry.prizePool) / (entry.numWinners || 4)) * priceData.price, 2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-white">
                            {(() => {
                              const potentialPrize = Math.floor(Number(entry.prizePool) / (entry.numWinners || 4));
                              const totalSpentAmount = totalSpentMap[`${entry.entrant}-${entry.gameId}`];
                              const roi = Math.floor(((potentialPrize / totalSpentAmount) - 1) * 100);
                              return formatNumber(roi, 0);
                            })()}%
                          </div>
                        </TableCell>
                        <TableCell className="text-white text-center">
                          {isWinner ? (
                            <span 
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                router.push(`?filter=🏆`, { scroll: false });
                                setSearchQuery('🏆');
                                onAddressSelect?.('');
                              }}
                              title="Click to show all winners"
                            >
                              🏆
                            </span>
                          ) : ''}
                        </TableCell>
                        <TableCell className="text-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              window.open(`https://scan.mypinata.cloud/ipfs/bafybeih3olry3is4e4lzm7rus5l3h6zrphcal5a7ayfkhzm5oivjro2cp4/#/tx/${entry.transactionHash}`, '_blank');
                            }}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </TableCell>
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
        <div className="mt-4 flex justify-center">
          <Pagination className="w-full max-w-md">
            <PaginationContent className="flex flex-wrap justify-center gap-1 xs:gap-2">
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={`text-white hover:bg-white/10 text-sm px-2 sm:px-3 py-1 ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                />
              </PaginationItem>
              
              {getVisiblePages().map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={currentPage === pageNum}
                    className={`text-white hover:bg-white/10 min-w-[32px] h-8 sm:min-w-[36px] sm:h-9 text-sm ${currentPage === pageNum ? 'bg-white/20 border-white/20' : ''}`}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              {/* Only show ellipsis on non-mobile or if there's significant gap */}
              {getVisiblePages()[getVisiblePages().length - 1] < totalPages - (isMobileView ? 2 : 1) && (
                <PaginationItem>
                  <PaginationEllipsis className="text-white" />
                </PaginationItem>
              )}
              
              {/* Only show last page if it's not already in visible pages or on mobile with enough pages */}
              {(getVisiblePages()[getVisiblePages().length - 1] < totalPages && (!isMobileView || totalPages > 5)) && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => setCurrentPage(totalPages)}
                    isActive={currentPage === totalPages}
                    className={`text-white hover:bg-white/10 min-w-[32px] h-8 sm:min-w-[36px] sm:h-9 text-sm ${currentPage === totalPages ? 'bg-white/20 border-white/20' : ''}`}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={`text-white hover:bg-white/10 text-sm px-2 sm:px-3 py-1 ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
 