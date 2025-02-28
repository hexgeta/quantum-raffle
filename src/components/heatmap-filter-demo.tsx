'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeIntervalFilter, TimeInterval } from './time-interval-filter';
import TicketsHeatmapChart from './tickets-heatmap-chart';

// Sample data for demonstration
const SAMPLE_EVENTS = [
  // Day 1
  { timestamp: '2023-05-01T01:15:00Z', numEntries: 5, entrant: '0x123' },
  { timestamp: '2023-05-01T01:45:00Z', numEntries: 3, entrant: '0x456' },
  { timestamp: '2023-05-01T02:05:00Z', numEntries: 8, entrant: '0x789' },
  { timestamp: '2023-05-01T02:25:00Z', numEntries: 2, entrant: '0x123' },
  { timestamp: '2023-05-01T04:10:00Z', numEntries: 10, entrant: '0xabc' },
  { timestamp: '2023-05-01T04:35:00Z', numEntries: 7, entrant: '0xdef' },
  { timestamp: '2023-05-01T12:20:00Z', numEntries: 15, entrant: '0x123' },
  { timestamp: '2023-05-01T12:50:00Z', numEntries: 9, entrant: '0x456' },
  { timestamp: '2023-05-01T18:05:00Z', numEntries: 12, entrant: '0x789' },
  { timestamp: '2023-05-01T18:35:00Z', numEntries: 6, entrant: '0xabc' },
  
  // Day 2
  { timestamp: '2023-05-02T03:15:00Z', numEntries: 8, entrant: '0x123' },
  { timestamp: '2023-05-02T03:45:00Z', numEntries: 4, entrant: '0x456' },
  { timestamp: '2023-05-02T07:10:00Z', numEntries: 11, entrant: '0x789' },
  { timestamp: '2023-05-02T07:25:00Z', numEntries: 3, entrant: '0xabc' },
  { timestamp: '2023-05-02T14:05:00Z', numEntries: 9, entrant: '0xdef' },
  { timestamp: '2023-05-02T14:55:00Z', numEntries: 7, entrant: '0x123' },
  { timestamp: '2023-05-02T20:30:00Z', numEntries: 14, entrant: '0x456' },
  { timestamp: '2023-05-02T20:45:00Z', numEntries: 5, entrant: '0x789' },
  
  // Day 3
  { timestamp: '2023-05-03T05:10:00Z', numEntries: 6, entrant: '0xabc' },
  { timestamp: '2023-05-03T05:40:00Z', numEntries: 9, entrant: '0xdef' },
  { timestamp: '2023-05-03T09:15:00Z', numEntries: 12, entrant: '0x123' },
  { timestamp: '2023-05-03T09:35:00Z', numEntries: 8, entrant: '0x456' },
  { timestamp: '2023-05-03T16:20:00Z', numEntries: 10, entrant: '0x789' },
  { timestamp: '2023-05-03T16:50:00Z', numEntries: 7, entrant: '0xabc' },
  { timestamp: '2023-05-03T22:05:00Z', numEntries: 15, entrant: '0xdef' },
  { timestamp: '2023-05-03T22:25:00Z', numEntries: 11, entrant: '0x123' },
];

export function HeatmapFilterDemo() {
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('hour');
  const [isLoading, setIsLoading] = useState(false);

  const handleIntervalChange = (interval: TimeInterval) => {
    setIsLoading(true);
    setSelectedInterval(interval);
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <Card className="bg-black border border-white/20 text-white">
      <CardHeader>
        <CardTitle className="text-2xl">Ticket Distribution Heatmap</CardTitle>
        <div className="text-sm text-white/60">
          View ticket distribution by hour or 10-minute intervals
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-end">
          <TimeIntervalFilter
            selectedInterval={selectedInterval}
            onIntervalChange={handleIntervalChange}
          />
        </div>
        <TicketsHeatmapChart 
          events={SAMPLE_EVENTS}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
} 