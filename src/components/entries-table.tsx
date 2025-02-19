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
}

// Helper function to format numbers with commas
const formatNumber = (value: number | string) => {
  return Number(value).toLocaleString('en-US', {
    maximumFractionDigits: 0
  });
};

const ITEMS_PER_PAGE = 100;

export function EntriesTable({ entries, isLoading }: EntriesTableProps) {
  const [isRendered, setIsRendered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedEntries, setDisplayedEntries] = useState<Entry[]>([]);

  const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);
  const maxVisiblePages = 5;

  useEffect(() => {
    if (!isLoading && entries.length > 0) {
      // First sort by timestamp in ascending order to assign ticket numbers
      const timeOrderedEntries = [...entries].sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateA.getTime() - dateB.getTime();
      });

      // Assign sequential ticket numbers starting from 1 (earliest gets #1)
      const numberedEntries = timeOrderedEntries.map((entry, index) => ({
        ...entry,
        ticketNumber: index + 1
      }));

      // Then sort by timestamp in descending order for display (latest first)
      const sortedEntries = numberedEntries.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });

      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      setDisplayedEntries(sortedEntries.slice(startIndex, endIndex));
      
      // Add a delay to ensure table is fully rendered
      setTimeout(() => {
        setIsRendered(true);
      }, 500);
    }
  }, [isLoading, entries, currentPage]);

  // Reset rendered state when loading changes
  useEffect(() => {
    if (isLoading) {
      setIsRendered(false);
    }
  }, [isLoading]);

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
      <div className="rounded-lg overflow-x-auto border border-white/20 rounded-[15px]">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#333] hover:bg-transparent">
                <TableHead className="text-gray-400 font-800 text-center">Game ID</TableHead>
                <TableHead className="text-gray-400 font-800 text-center">Block</TableHead>
                <TableHead className="text-gray-400 font-800 text-center">Time</TableHead>
                <TableHead className="text-gray-400 font-800 text-center">Ticket #</TableHead>
                <TableHead className="text-gray-400 font-800 text-center">Entrant</TableHead>
                <TableHead className="text-gray-400 font-800 text-center">Entry Amount</TableHead>
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
                  <TableCell colSpan={8} className="text-center py-4 text-white/40">
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

                  return (
                    <TableRow 
                      key={`${entry.transactionHash}-${entry.ticketNumber}`}
                      className="border-b border-[#333] hover:bg-[#1a1a1a]"
                    >
                      <TableCell className="text-white text-center">{formatNumber(entry.gameId)}</TableCell>
                      <TableCell className="text-white text-center">{formatNumber(entry.blockNumber)}</TableCell>
                      <TableCell className="text-white text-center">{entry.timestamp}</TableCell>
                      <TableCell className="text-white text-center">{formatNumber(entry.ticketNumber)}</TableCell>
                      <TableCell className="text-white text-center">
                        {`${entry.entrant.slice(0, 6)}...${entry.entrant.slice(-4)}`}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-white">{formatNumber(entry.entryAmount)}</div>
                        <div className="text-gray-500">PLS</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-white">{formatNumber(entry.prizePool)}</div>
                        <div className="text-gray-500">PLS</div>
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
 