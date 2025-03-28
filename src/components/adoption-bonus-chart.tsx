'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useCryptoPrice } from '@/hooks/use-crypto-price';
import { useRouter, useSearchParams } from 'next/navigation';

interface Event {
  timestamp: string;
  entrant: string;
  ticketNumber: number;
  gameId: number;
  numEntries: number;
}

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
  gameId: number;
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
  const [bonusPoolInfo, setBonusPoolInfo] = useState<{ totalBonus: number; claimablePerTeam1: number }>({ totalBonus: 0, claimablePerTeam1: 0 });
  const { priceData } = useCryptoPrice('PLS');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Store full addresses in a map for lookup
  const [addressMap, setAddressMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (events.length > 0) {
      // First sort by timestamp in ascending order
      const timeOrderedEvents = [...events].sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateA.getTime() - dateB.getTime();
      });

      // Expand events into individual tickets and assign sequential numbers
      const expandedEvents: Event[] = [];
      let ticketNumber = 1;
      for (const event of timeOrderedEvents) {
        for (let i = 0; i < event.numEntries; i++) {
          expandedEvents.push({
            ...event,
            ticketNumber: ticketNumber++
          });
        }
      }

      // Calculate total deposits and bonus pool info
      const totalDeposits = expandedEvents.reduce((sum: number, e: Event) => {
        const ticketCost = e.ticketNumber <= 9 ? 2000000 : 200000;
        return sum + ticketCost;
      }, 0);
      
      const totalViralBonus = totalDeposits / 5;
      let displayBonus = totalViralBonus;
      let displayClaimable = 0;

      if (expandedEvents.length >= 99) {
        // Calculate claimable based on contract logic
        const team1Size = 9;
        const cohort2Deposits = expandedEvents
          .filter((e: Event) => e.ticketNumber >= 10 && e.ticketNumber <= 99)
          .reduce((sum: number, e: Event) => sum + 200000, 0);
        const cohort2Bonus = cohort2Deposits / 5;
        displayClaimable = cohort2Bonus / team1Size;
      }

      setBonusPoolInfo({
        totalBonus: displayBonus,
        claimablePerTeam1: displayClaimable
      });

      // Create a map for shortened to full addresses
      const newAddressMap = new Map<string, string>();

      // Get current active address from URL
      const activeAddress = searchParams.get('address');
      const hasActiveAddress = !!activeAddress;

      // Process each ticket to calculate adoption bonus
      const processedData = expandedEvents.map((event) => {
        const shortAddress = `${event.entrant.slice(0, 6)}...${event.entrant.slice(-4)}`;
        const isActive = event.entrant === activeAddress;
        newAddressMap.set(shortAddress, event.entrant);

        let claimableBonus = 0;
        let pendingBonus = 0;

        // Calculate dynamically per contract logic
        const entrantCohort = getNumDigits(event.ticketNumber);
        const totalCohort = getNumDigits(expandedEvents.length);
        
        // Calculate claimable bonus from filled lower cohorts
        if (event.ticketNumber <= 9 && expandedEvents.length >= 99) {
          // Calculate Team 1's total deposits (tickets 1-9)
          const team1Deposits = expandedEvents
            .filter(e => e.ticketNumber <= 9)
            .reduce((sum, e) => sum + 2000000, 0);
          
          // Calculate Team 2's total deposits (tickets 10-99)
          const team2Deposits = expandedEvents
            .filter(e => e.ticketNumber >= 10 && e.ticketNumber <= 99)
            .reduce((sum, e) => sum + 200000, 0);
          
          // Both teams' bonus pools (20% of deposits)
          const team1BonusPool = team1Deposits / 5;
          const team2BonusPool = team2Deposits / 5;
          
          // Split total bonus among Team 1 (9 members)
          claimableBonus = (team1BonusPool + team2BonusPool) / 9;
        }

        // Calculate pending bonus from unfilled higher cohorts
        for (let cohortId = entrantCohort + 1; cohortId <= totalCohort; cohortId++) {
          // Calculate cohort's bonus pool (20% of deposits for that cohort)
          const cohortStart = Math.pow(10, cohortId - 1);
          const cohortEnd = Math.min(expandedEvents.length, Math.pow(10, cohortId) - 1);
          const cohortDeposits = expandedEvents
            .filter((e: Event) => e.ticketNumber > cohortStart - 1 && e.ticketNumber <= cohortEnd)
            .reduce((sum: number, e: Event) => sum + (e.ticketNumber <= 9 ? 2000000 : 200000), 0);
          
          const cohortBonusPool = cohortDeposits / 5;

          if (event.ticketNumber <= 9) {
            // For Team 1, they get half of Team 3's bonus pool
            if (cohortId === 3) {
              pendingBonus = cohortBonusPool / 2 / 9; // Half of Team 3's bonus divided by 9 Team 1 members
            }
          } else {
            // For other teams, calculate as before
            const teamPrize = cohortBonusPool / (cohortId - 1);
            const teamSize = Math.pow(10, entrantCohort) - Math.pow(10, entrantCohort - 1);
            const prize = teamPrize / teamSize;
            pendingBonus += prize;
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
          cohortId: event.ticketNumber <= 9 ? 1 : (event.ticketNumber <= 99 ? 2 : 3),
          teamId: event.ticketNumber <= 9 ? 1 : (event.ticketNumber <= 99 ? 2 : 3),
          ticketNumber: event.ticketNumber,
          gameId: event.gameId
        };
      });

      // Sort by ticket number for chronological display
      processedData.sort((a, b) => a.ticketNumber - b.ticketNumber);
      
      // Limit to first 50 tickets
      const limitedData = processedData.slice(0, 50);
      
      console.log('Final processed data:', limitedData);

      setAddressMap(newAddressMap);
      setChartData(limitedData);
      
      // Add a delay to ensure chart is fully rendered and transitions are smooth
      setTimeout(() => {
        setIsRendered(true);
      }, 100);
    } else {
      // Reset chart data when no events
      setChartData([]);
      setAddressMap(new Map());
      setBonusPoolInfo({ totalBonus: 0, claimablePerTeam1: 0 });
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
              Viral Bonus Distribution by Team
            </h2>
            <div className="text-sm text-white/60 ml-10 mt-1">
              Total Pool: {Math.round(bonusPoolInfo.totalBonus).toLocaleString()} PLS 
              {bonusPoolInfo.claimablePerTeam1 > 0 && 
                ` • Claimable per Team 1: ${Math.round(bonusPoolInfo.claimablePerTeam1).toLocaleString()} PLS`}
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 30, right: 20, left: 20, bottom: 60 }}
              barCategoryGap={1}
            >
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
                interval={0}
              />
              <YAxis 
                axisLine={false}
                tickLine={{ stroke: '#888', strokeWidth: 0 }}
                tick={{ fill: '#888', fontSize: 14 }}
                tickCount={5}
                domain={[1000, 'auto']}
                scale="log"
                allowDataOverflow={true}
                tickFormatter={(value) => {
                  if (value === 0) return "0";
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(0)}K`;
                  }
                  return value.toString();
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
                    `${props.payload.entrant}\nTicket #${props.payload.ticketNumber}\nTeam: ${props.payload.teamId}\n\nClaimable:\n${Math.round(claimable).toLocaleString()} PLS\n$${usdClaimable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nPending:\n${Math.round(pending).toLocaleString()} PLS\n$${usdPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    ''
                  ];
                }}
                separator=""
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
              />
              <Bar 
                dataKey="totalBonus" 
                fill="#55FF9F"
                radius={[2, 2, 0, 0]}
                minPointSize={2}
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