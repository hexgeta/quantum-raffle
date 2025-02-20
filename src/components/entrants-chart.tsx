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
      // Create a map to store total entries per address
      const entriesPerAddress = events.reduce((acc, event) => {
        const key = event.entrant;
        acc.set(key, (acc.get(key) || 0) + Number(event.numEntries));
        return acc;
      }, new Map<string, number>());

      // Create a map for shortened to full addresses
      const newAddressMap = new Map<string, string>();

      // Get current active address from URL
      const activeAddress = searchParams.get('address');
      const hasActiveAddress = !!activeAddress;

      // Convert map to array and sort by total entries
      const sortedData = Array.from(entriesPerAddress.entries())
        .map((entry) => {
          const [address, totalEntries] = entry as [string, number];
          const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
          const isActive = address === activeAddress;
          newAddressMap.set(shortAddress, address);
          return {
            entrant: shortAddress,
            totalEntries,
            isActive,
            fill: hasActiveAddress 
              ? (isActive ? "#55FF9F" : "rgba(85, 255, 159, 0.2)")
              : "#55FF9F"
          };
        })
        .sort((a, b) => b.totalEntries - a.totalEntries)
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
        if (data.isActive) {
          // Clear filter
          router.push('/', { scroll: false });
          onAddressSelect?.('');
        } else {
          // Set filter
          router.push(`?address=${fullAddress}`, { scroll: false });
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
                formatter={(value: any) => {
                  const totalPLS = value * 200000;
                  const totalUSD = totalPLS * (priceData?.price ?? 0);
                  return [
                    `${value.toLocaleString()} tickets\n${totalPLS.toLocaleString()} PLS\n$${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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