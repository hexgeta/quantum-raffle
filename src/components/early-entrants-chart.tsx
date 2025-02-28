'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useCryptoPrice } from '@/hooks/use-crypto-price';
import { useRouter, useSearchParams } from 'next/navigation';

interface ChartData {
  entrant: string;
  totalEntries: number;
  timestamp: string;
  isActive?: boolean;
  fill: string;
  ticketNumber: number;
}

interface Props {
  events: any[];
  isLoading: boolean;
  onAddressSelect?: (address: string) => void;
}

function EarlyEntrantsChart({ events, isLoading, onAddressSelect }: Props) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isRendered, setIsRendered] = useState(false);
  const { priceData } = useCryptoPrice('PLS');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Store full addresses in a map for lookup
  const [addressMap, setAddressMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (events.length > 0) {
      // Sort events by timestamp first
      const sortedEvents = [...events].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Create a map for shortened to full addresses
      const newAddressMap = new Map<string, string>();

      // Get current active address from URL
      const activeAddress = searchParams.get('address');
      const hasActiveAddress = !!activeAddress;

      // Track ticket numbers and create entries for each ticket
      let currentTicketNumber = 1;
      let ticketData: ChartData[] = [];

      for (const event of sortedEvents) {
        // For each event, create entries for each ticket
        for (let i = 0; i < event.numEntries; i++) {
          if (currentTicketNumber > 50) break; // Only process first 50 tickets

          const shortAddress = `${event.entrant.slice(0, 6)}...${event.entrant.slice(-4)}`;
          const isActive = event.entrant === activeAddress;
          newAddressMap.set(shortAddress, event.entrant);

          ticketData.push({
            entrant: shortAddress,
            totalEntries: currentTicketNumber <= 9 ? 2000000 : 200000, // PLS value based on ticket number
            timestamp: new Date(event.timestamp).toLocaleString('en-US', { 
              timeZone: 'UTC',
              month: 'numeric',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) + ' UTC',
            isActive,
            fill: hasActiveAddress 
              ? (isActive ? "#55FF9F" : "rgba(85, 255, 159, 0.2)")
              : "#55FF9F",
            ticketNumber: currentTicketNumber
          });

          currentTicketNumber++;
        }
        if (currentTicketNumber > 50) break;
      }

      setAddressMap(newAddressMap);
      setChartData(ticketData);
      
      setTimeout(() => {
        setIsRendered(true);
      }, 500);
    } else {
      // Reset chart data when no events
      setChartData([]);
      setAddressMap(new Map());
      setIsRendered(true);
    }
  }, [events, searchParams]);

  // Reset rendered state when loading changes
  useEffect(() => {
    if (isLoading) {
      setIsRendered(false);
    }
  }, [isLoading]);

  const handleBarClick = (data: any) => {
    if (data && data.entrant) {
      const fullAddress = addressMap.get(data.entrant);
      if (fullAddress) {
        // Check if this bar is already active (already filtered)
        const isAlreadyActive = chartData.find(item => item.entrant === data.entrant)?.isActive;
        
        if (isAlreadyActive) {
          // If already active, unfilter by clearing the address filter
          const updatedChartData = chartData.map(item => ({
            ...item,
            isActive: false,
            fill: "#55FF9F"
          }));
          
          setChartData(updatedChartData);
          
          // Clear the address filter from URL
          router.push(`?utm_source=filter_feature`, { scroll: false });
          
          // Notify parent component
          onAddressSelect?.('');
        } else {
          // Update the chart data to highlight the selected bar
          const updatedChartData = chartData.map(item => ({
            ...item,
            isActive: item.entrant === data.entrant,
            fill: item.entrant === data.entrant ? "#55FF9F" : "rgba(85, 255, 159, 0.2)"
          }));
          
          setChartData(updatedChartData);
          
          // Update URL with address filter
          const urlParams = new URLSearchParams();
          urlParams.append('address', fullAddress);
          urlParams.append('utm_source', 'filter_feature');
          router.push(`?${urlParams.toString()}`, { scroll: false });
          
          // Notify parent component
          onAddressSelect?.(fullAddress);
        }
      }
    }
  };

  // If no data, show empty state
  if (isRendered && chartData.length === 0) {
    return (
      <div className="w-full h-[450px] relative py-4">
        <div className="w-full h-full p-5 border border-white/20 rounded-[15px] flex items-center justify-center">
          <p className="text-white/40">No early entrants data available for this game</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[450px] relative py-4">
      {(isLoading || !isRendered) ? (
        <div className="w-full h-full p-5 border border-white/20 rounded-[15px]">
          <div className="h-8 w-48 bg-white/10 rounded mb-8 ml-10" />
          <div className="w-full h-[300px] flex items-end px-10">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1 bg-white/10 rounded-t mx-1"
                style={{ height: '40%' }} 
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 px-10">
            <div className="h-4 w-20 bg-white/10 rounded" />
            <div className="h-4 w-20 bg-white/10 rounded" />
          </div>
        </div>
      ) : (
        <div className="w-full h-full p-5 border border-white/20 rounded-[15px]">
          <h2 className="text-left text-white text-2xl mb-0 ml-10">
            First 50 Earliest Entrants
          </h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 30, right: 20, left: 20, bottom: 60 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(136, 136, 136, 0.2)" 
                vertical={false} 
              />
              <XAxis 
                dataKey="entrant"
                axisLine={{ stroke: '#888', strokeWidth: 0 }}
                tickLine={{ stroke: '#888', strokeWidth: 0 }}
                tick={{ fill: '#888', fontSize: 12 }}
                angle={45}
                textAnchor="start"
                height={60}
              />
              <YAxis 
                axisLine={false}
                tickLine={{ stroke: '#888', strokeWidth: 0 }}
                tick={{ fill: '#888', fontSize: 14 }}
                tickCount={5}
                domain={[0, 2000000]}
                tickFormatter={(value) => {
                  if (value === 0) return "0";
                  return `${(value / 1000000).toFixed(1)}M`;
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(13, 13, 13, 0.85)', 
                  border: '1px solid rgba(255, 255, 255, 0.2)', 
                  borderRadius: '10px',
                  padding: '12px'
                }}
                labelStyle={{ color: 'white', marginBottom: '10px' }}
                itemStyle={{ color: 'white', whiteSpace: 'pre-line' }}
                labelFormatter={(label: string, payload: any[]) => {
                  if (payload && payload[0]) {
                    return new Date(payload[0].payload.timestamp).toLocaleString('en-US', {
                      timeZone: 'UTC',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) + ' UTC';
                  }
                  return '';
                }}
                formatter={(value: any, name: string, props: any) => {
                  // Calculate PLS based on ticket number
                  const totalPLS = props.payload.ticketNumber <= 9 ? 2000000 : 200000;
                  const totalUSD = totalPLS * (priceData?.price ?? 0);
                  
                  return [
                    `${props.payload.entrant}\nTicket #${props.payload.ticketNumber}\n${totalPLS.toLocaleString()} PLS\n$${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    ''
                  ];
                }}
                separator=""
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
              />
              <Bar 
                dataKey="totalEntries" 
                fill="fill"
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
                onClick={handleBarClick}
                style={{ cursor: 'pointer', transition: 'all 500ms ease-in-out' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default EarlyEntrantsChart; 