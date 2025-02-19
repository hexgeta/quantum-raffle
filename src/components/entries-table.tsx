'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export function EntriesTable({ entries, isLoading }: EntriesTableProps) {
  return (
    <Card className="bg-black/40 border-none">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white/80">Recent Game Entries</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-white/60">Loading past events...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-4 text-white/60">No events found</div>
        ) : (
          <div className="rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white/60">Game ID</TableHead>
                  <TableHead className="text-white/60">Block</TableHead>
                  <TableHead className="text-white/60">Time</TableHead>
                  <TableHead className="text-white/60">Ticket #</TableHead>
                  <TableHead className="text-white/60">Entrant</TableHead>
                  <TableHead className="text-right text-white/60">Entry Amount</TableHead>
                  <TableHead className="text-right text-white/60">Prize Pool</TableHead>
                  <TableHead className="text-right text-white/60">Entries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow 
                    key={`${entry.transactionHash}-${entry.ticketNumber}`}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell className="font-mono text-white/80">{entry.gameId}</TableCell>
                    <TableCell className="font-mono text-white/80">{entry.blockNumber}</TableCell>
                    <TableCell className="text-white/80">{entry.timestamp}</TableCell>
                    <TableCell className="font-mono text-white/80">{entry.ticketNumber}</TableCell>
                    <TableCell className="font-mono text-white/80">
                      {`${entry.entrant.slice(0, 6)}...${entry.entrant.slice(-4)}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-white/80">{entry.entryAmount}</div>
                      <div className="text-sm text-white/60">PLS</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-white/80">{entry.prizePool}</div>
                      <div className="text-sm text-white/60">PLS</div>
                    </TableCell>
                    <TableCell className="text-right text-white/80">{entry.numEntries}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
 