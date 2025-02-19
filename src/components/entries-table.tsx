'use client';

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
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white/80 mb-6">Recent Game Entries</h2>
      {isLoading ? (
        <div className="text-center py-4 text-white/40">Loading past events...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-4 text-white/40">No events found</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-white/40">Game ID</TableHead>
                <TableHead className="text-white/40">Block</TableHead>
                <TableHead className="text-white/40">Time</TableHead>
                <TableHead className="text-white/40">Ticket #</TableHead>
                <TableHead className="text-white/40">Entrant</TableHead>
                <TableHead className="text-right text-white/40">Entry Amount</TableHead>
                <TableHead className="text-right text-white/40">Prize Pool</TableHead>
                <TableHead className="text-right text-white/40">Entries</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow 
                  key={`${entry.transactionHash}-${entry.ticketNumber}`}
                  className="border-white/10 hover:bg-white/[0.02] transition-colors"
                >
                  <TableCell className="font-mono text-white/80">{formatNumber(entry.gameId)}</TableCell>
                  <TableCell className="font-mono text-white/60">{formatNumber(entry.blockNumber)}</TableCell>
                  <TableCell className="text-white/60">{entry.timestamp}</TableCell>
                  <TableCell className="font-mono text-white/80">{formatNumber(entry.ticketNumber)}</TableCell>
                  <TableCell className="font-mono text-white/60">
                    {`${entry.entrant.slice(0, 6)}...${entry.entrant.slice(-4)}`}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-white/80">{formatNumber(entry.entryAmount)}</div>
                    <div className="text-sm text-white/40">PLS</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-white/80">{formatNumber(entry.prizePool)}</div>
                    <div className="text-sm text-white/40">PLS</div>
                  </TableCell>
                  <TableCell className="text-right text-white/60">{formatNumber(entry.numEntries)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
 