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
  isActive?: boolean;
  fill: string;
  totalPLS: number;
}

interface Props {
  events: any[];
  isLoading: boolean;
  onAddressSelect?: (address: string) => void;
}

function EntrantsChart({ events, isLoading, onAddressSelect }: Props) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isRendered, setIsRendered] = useState(false);
  const { priceData } = useCryptoPrice('PLS');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Store full addresses in a map for lookup
  const [addressMap, setAddressMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (events.length > 0) {
      // Get current active address and excluded address from URL
      const activeAddress = searchParams.get('address');
      const excludedAddress = searchParams.get('exclude');
      const hasActiveAddress = !!activeAddress;
      
      // Filter out excluded address if present (with partial matching)
      const filteredEvents = excludedAddress 
        ? events.filter(event => !event.entrant.toLowerCase().includes(excludedAddress.toLowerCase()))
        : events;
      
      // Create a map to store total entries per address
      const entriesPerAddress = filteredEvents.reduce((acc, event) => {
        const key = event.entrant;
        acc.set(key, (acc.get(key) || 0) + Number(event.numEntries));
        return acc;
      }, new Map<string, number>());

      // Create a map for shortened to full addresses
      const newAddressMap = new Map<string, string>();

      // Sort events by timestamp to calculate ticket numbers correctly
      const sortedEvents = [...filteredEvents].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Track ticket numbers per address to calculate total PLS
      const addressTicketMap = new Map<string, number[]>();
      let globalTicketNumber = 1;

      // First pass: build ticket number sequences for each address
      for (const event of sortedEvents) {
        const tickets = addressTicketMap.get(event.entrant) || [];
        for (let i = 0; i < event.numEntries; i++) {
          tickets.push(globalTicketNumber++);
        }
        addressTicketMap.set(event.entrant, tickets);
      }

      // Convert map to array and sort by total entries
      const sortedData = Array.from(entriesPerAddress.entries() as Iterable<[string, number]>)
        .map(([address, totalEntries]) => {
          const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
          const isActive = address === activeAddress;
          newAddressMap.set(shortAddress, address);

          // Calculate total PLS based on ticket numbers
          const tickets = addressTicketMap.get(address) || [];
          const totalPLS = tickets.reduce((sum, ticketNum) => 
            sum + (ticketNum <= 9 ? 2000000 : 200000), 0
          );

          return {
            entrant: shortAddress,
            totalEntries,
            isActive,
            fill: hasActiveAddress 
              ? (isActive ? "#55FF9F" : "rgba(85, 255, 159, 0.2)")
              : "#55FF9F",
            totalPLS
          } as ChartData;
        })
        .sort((a: ChartData, b: ChartData) => b.totalEntries - a.totalEntries)
        .slice(0, 20);

      setAddressMap(newAddressMap);
      setChartData(sortedData);
      
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
          // Get the current exclude parameter if it exists
          const excludeParam = searchParams.get('exclude');
          if (excludeParam) {
            router.push(`?exclude=${excludeParam}`, { scroll: false });
          } else {
            router.push(`/`, { scroll: false });
          }
          
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
          
          // Preserve exclude parameter if it exists
          const excludeParam = searchParams.get('exclude');
          if (excludeParam) {
            urlParams.append('exclude', excludeParam);
          }
          
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
          <p className="text-white/40">No entrants data available for this game</p>
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
            Top 20 Entrants by Ticket Count
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
                domain={[0, 'dataMax']}
                tickFormatter={(value) => {
                  if (value === 0) return "0";
                  return `${value.toLocaleString()}`;
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(13, 13, 13, 0.85)', 
                  border: '1px solid rgba(255, 255, 255, 0.2)', 
                  borderRadius: '10px',
                  padding: '12px'
                }}
                labelStyle={{ color: 'white', marginBottom: '4px' }}
                itemStyle={{ color: 'white', whiteSpace: 'pre-line' }}
                formatter={(value: any, name: string, props: any) => {
                  const totalPLS = props.payload.totalPLS;
                  const totalUSD = totalPLS * (priceData?.price ?? 0);
                  
                  return [
                    `${props.payload.entrant}\n${value.toLocaleString()} tickets\n${totalPLS.toLocaleString()} PLS\n$${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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

export default EntrantsChart; 