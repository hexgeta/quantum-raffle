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

export function EntriesTable({ entries, isLoading }: EntriesTableProps) {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (!isLoading && entries.length > 0) {
      // Add a delay to ensure table is fully rendered
      setTimeout(() => {
        setIsRendered(true);
      }, 500);
    }
  }, [isLoading, entries]);

  // Reset rendered state when loading changes
  useEffect(() => {
    if (isLoading) {
      setIsRendered(false);
    }
  }, [isLoading]);

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
                <TableHead className="text-gray-400 font-800 text-center">Entries</TableHead>
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
                entries.map((entry) => (
                  <TableRow 
                    key={`${entry.transactionHash}-${entry.ticketNumber}`}
                    className="border-b border-[#333] hover:bg-[#1a1a1a]"
                  >
                    <TableCell className="text-white text-center font-mono">{formatNumber(entry.gameId)}</TableCell>
                    <TableCell className="text-white text-center font-mono">{formatNumber(entry.blockNumber)}</TableCell>
                    <TableCell className="text-white text-center">{entry.timestamp}</TableCell>
                    <TableCell className="text-white text-center font-mono">{formatNumber(entry.ticketNumber)}</TableCell>
                    <TableCell className="text-white text-center font-mono">
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
                    <TableCell className="text-white text-center">{formatNumber(entry.numEntries)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
 