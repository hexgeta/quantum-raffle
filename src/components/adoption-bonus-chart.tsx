'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useCryptoPrice } from '@/hooks/use-crypto-price';
import { useRouter, useSearchParams } from 'next/navigation';

interface ChartData {
  entrant: string;
  claimableBonus: number;
  pendingBonus: number;
  totalBonus: number;
  timestamp: string;
  isActive?: boolean;
  fill: string;
  cohortId: number;
  teamId: number;
  ticketNumber: number;
}

interface Props {
  events: any[];
  isLoading: boolean;
  onAddressSelect?: (address: string) => void;
}

function getNumDigits(value: number): number {
  if (value === 0) return 1;
  return Math.floor(Math.log10(value)) + 1;
}

function AdoptionBonusChart({ events, isLoading, onAddressSelect }: Props) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isRendered, setIsRendered] = useState(false);
  const { priceData } = useCryptoPrice('PLS');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Store full addresses in a map for lookup
  const [addressMap, setAddressMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (events.length > 0) {
      // Calculate total deposits for this game
      const totalDeposits = events.reduce((sum, event) => 
        sum + Number(event.entryAmount), 0
      );
      
      // Sort events by timestamp first
      const sortedEvents = [...events].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Create a map for shortened to full addresses
      const newAddressMap = new Map<string, string>();

      // Get current active address from URL
      const activeAddress = searchParams.get('address');
      const hasActiveAddress = !!activeAddress;

      // Get total number of entrants and its cohort
      const totalEntrants = events[events.length - 1]?.entrantCount || 0;
      const totalEntrantsCohort = getNumDigits(totalEntrants);

      // Process events to calculate adoption bonus
      const processedData = sortedEvents.map((event, index) => {
        const entrantId = event.entrantCount;
        const entrantCohort = getNumDigits(entrantId);
        const shortAddress = `${event.entrant.slice(0, 6)}...${event.entrant.slice(-4)}`;
        const isActive = event.entrant === activeAddress;
        newAddressMap.set(shortAddress, event.entrant);

        let claimableBonus = 0;
        let pendingBonus = 0;

        // For each cohort after this entrant's cohort
        for (let cohortId = entrantCohort + 1; cohortId <= 4; cohortId++) {
          // Calculate adoption bonus pool for this cohort (20% of deposits)
          const cohortPool = (totalDeposits / 5) * (events.length > 0 ? events[0].numEntries : 0) / events.length;
          
          // Calculate team prize for this cohort
          const teamPrize = cohortPool / (cohortId - 1);
          
          // Calculate number of members in team (based on entrant's digits)
          const teamSize = Math.pow(10, entrantCohort) - Math.pow(10, entrantCohort - 1);
          
          // Calculate individual prize share
          const prizeShare = teamPrize / teamSize;

          // Check if this cohort is claimable (has been surpassed)
          if (cohortId < totalEntrantsCohort) {
            claimableBonus += prizeShare;
          } else {
            pendingBonus += prizeShare;
          }
        }

        return {
          entrant: shortAddress,
          claimableBonus,
          pendingBonus,
          totalBonus: claimableBonus + pendingBonus,
          timestamp: event.timestamp,
          isActive,
          fill: hasActiveAddress 
            ? (isActive ? "#55FF9F" : "rgba(85, 255, 159, 0.2)")
            : "#55FF9F",
          cohortId: entrantCohort,
          teamId: Math.min(entrantCohort, 3),
          ticketNumber: entrantId
        };
      });

      // Sort by total bonus amount for better visualization
      processedData.sort((a, b) => b.totalBonus - a.totalBonus);

      setAddressMap(newAddressMap);
      setChartData(processedData);
      
      // Add a delay to ensure chart is fully rendered and transitions are smooth
      setTimeout(() => {
        setIsRendered(true);
      }, 100);
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
          <p className="text-white/40">No adoption bonus data available for this game</p>
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
          <div className="flex flex-col">
            <h2 className="text-left text-white text-2xl mb-0 ml-10">
              Adoption Bonus Distribution by Team
            </h2>
            {(() => {
              // Calculate total deposits and adoption bonus pool
              const totalDeposits = events.reduce((sum, event) => sum + Number(event.entryAmount), 0);
              const totalAdoptionPool = totalDeposits / 5; // 20% of deposits
              
              // Get the last cohort's pool (which could be leftover)
              const lastCohortId = getNumDigits(events[events.length - 1]?.entrantCount || 0);
              const lastCohortPool = totalAdoptionPool * (events[events.length - 1]?.numEntries || 0) / events.length;
              
              return (
                <div className="text-sm text-white/60 ml-10 mt-1">
                  Total Pool: {Math.round(totalAdoptionPool).toLocaleString()} PLS 
                  {lastCohortPool > 0 && ` • Last Cohort (${lastCohortId}): ${Math.round(lastCohortPool).toLocaleString()} PLS`}
                </div>
              );
            })()}
          </div>
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
                scale="log"
                domain={['auto', 'auto']}
                tickFormatter={(value) => {
                  if (value === 0) return "0";
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`;
                  }
                  return value.toFixed(0);
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
                    return new Date(payload[0].payload.timestamp).toLocaleString();
                  }
                  return '';
                }}
                formatter={(value: any, name: string, props: any) => {
                  const claimable = props.payload.claimableBonus;
                  const pending = props.payload.pendingBonus;
                  const usdClaimable = claimable * (priceData?.price ?? 0);
                  const usdPending = pending * (priceData?.price ?? 0);
                  return [
                    `${props.payload.entrant}\nTicket #${props.payload.ticketNumber}\nTeam: ${props.payload.teamId}\n\nClaimable:\n${claimable.toLocaleString()} PLS\n$${usdClaimable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nPending:\n${pending.toLocaleString()} PLS\n$${usdPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    ''
                  ];
                }}
                separator=""
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
              />
              <Bar 
                dataKey="totalBonus" 
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

export default AdoptionBonusChart;