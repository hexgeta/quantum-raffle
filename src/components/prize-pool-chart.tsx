'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  TooltipProps, Bar, ComposedChart
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useCryptoPrice } from '@/hooks/use-crypto-price';
import { useSearchParams } from 'next/navigation';

interface ChartData {
  timestamp: string;
  prizePool: number;
  prizePoolUsd: number;
  gameId: string;
  transactions?: number;
  numEntries?: number;
  claimableBonus?: number;
  pendingBonus?: number;
}

interface Props {
  events: any[];
  isLoading: boolean;
}

function PrizePoolChart({ events, isLoading }: Props) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isRendered, setIsRendered] = useState(false);
  const { priceData } = useCryptoPrice('PLS');
  const searchParams = useSearchParams();

  useEffect(() => {
    if (events.length > 0 && priceData?.price) {
      // Get filtered address from URL
      const filteredAddress = searchParams.get('address');

      // Sort events by timestamp first
      const sortedEvents = [...events].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Keep track of global ticket count
      let globalTicketCount = 0;

      // Process events to create time series data
      const timeSeriesData = sortedEvents.map(event => {
        const formattedTime = new Date(event.timestamp).toLocaleString('en-US', { 
          timeZone: 'UTC',
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) + ' UTC';

        // If we have a filtered address, add transaction data
        const isFilteredTransaction = filteredAddress && event.entrant === filteredAddress;
        
        // Calculate transaction amount based on global ticket count
        let transactionAmount = 0;
        if (isFilteredTransaction) {
          for (let i = 0; i < event.numEntries; i++) {
            transactionAmount += (globalTicketCount < 9 ? 2000000 : 200000);
            globalTicketCount++;
          }
        } else {
          globalTicketCount += event.numEntries;
        }

        // Calculate claimable bonus for Cohort 1 members
        let claimableBonus = 0;
        let pendingBonus = 0;
        if (globalTicketCount >= 99) { // Cohort 2 is filled
          if (isFilteredTransaction && event.ticketNumber <= 9) {
            claimableBonus = 800000; // Exact number from spreadsheet
            pendingBonus = 3100000 / 9; // 3.1M PLS divided by 9 team members
          } else if (event.ticketNumber >= 10 && event.ticketNumber <= 99) {
            pendingBonus = 3100000 / 90; // 3.1M PLS divided by 90 team members
          }
        }
        
        return {
          timestamp: formattedTime,
          prizePool: parseFloat(event.prizePool),
          prizePoolUsd: parseFloat(event.prizePool) * priceData.price,
          gameId: event.gameId,
          transactions: transactionAmount,
          numEntries: isFilteredTransaction ? event.numEntries : 0,
          claimableBonus,
          pendingBonus
        };
      });

      console.log('Final time series data:', timeSeriesData);

      setChartData(timeSeriesData);
      setTimeout(() => {
        setIsRendered(true);
      }, 500);
    } else {
      setChartData([]);
      setIsRendered(true);
    }
  }, [events, priceData?.price, searchParams]);

  // Reset rendered state when loading changes
  useEffect(() => {
    if (isLoading) {
      setIsRendered(false);
    }
  }, [isLoading]);

  // If no data, show empty state
  if (isRendered && chartData.length === 0) {
    return (
      <div className="w-full h-[450px] relative py-4">
        <div className="w-full h-full p-5 border border-white/20 rounded-[15px] flex items-center justify-center">
          <p className="text-white/40">No prize pool data available for this game</p>
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
            Prize Pool Over Time
          </h2>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 30, right: 20, left: 20, bottom: 60 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(136, 136, 136, 0.2)" 
                vertical={false} 
              />
              <XAxis 
                dataKey="timestamp"
                axisLine={{ stroke: '#888', strokeWidth: 0 }}
                tickLine={{ stroke: '#888', strokeWidth: 0 }}
                tick={{ fill: '#888', fontSize: 14, dy: 5 }}
                ticks={[chartData[0]?.timestamp, chartData[chartData.length - 1]?.timestamp]}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { 
                    timeZone: 'UTC',
                    month: 'short',
                    day: 'numeric'
                  });
                }}
              />
              <YAxis 
                yAxisId="pls"
                axisLine={false}
                tickLine={{ stroke: '#888', strokeWidth: 0 }}
                tick={{ fill: '#888', fontSize: 14, dx: -5}}
                tickCount={5}
                domain={[0, 'dataMax']}
                tickFormatter={(value) => {
                  if (value === 0) return "0";
                  const inMillions = value / 1000000;
                  if (inMillions >= 100) {
                    return `${Math.round(inMillions / 100) * 100}M`;
                  }
                  return `${Math.round(inMillions)}M`;
                }}
              />
              <YAxis 
                yAxisId="transactions"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={false}
                domain={[0, 'dataMax']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.85)', 
                  border: '1px solid rgba(255, 255, 255, 0.2)', 
                  borderRadius: '10px',
                  padding: '12px'
                }}
                labelStyle={{ color: 'white', marginBottom: '4px' }}
                itemStyle={{ color: 'white', whiteSpace: 'pre-line' }}
                separator=""
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleString('en-US', {
                    timeZone: 'UTC',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }) + ' UTC';
                }}
                formatter={(value: any, name: string, props: any) => {
                  if (typeof value !== 'number') return '';
                  if (name === "Prize Pool") {
                    const plsValue = props.payload.prizePool;
                    const usdValue = props.payload.prizePoolUsd;
                    return [
                      `${plsValue.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })} PLS\n$${usdValue.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}`
                    ];
                  } else if (name === "Transactions" && value > 0) {
                    const bonusText = props.payload.claimableBonus > 0 
                      ? `\nClaimable: ${props.payload.claimableBonus.toLocaleString()} PLS`
                      : '';
                    const pendingText = props.payload.pendingBonus > 0
                      ? `\nPending: ${props.payload.pendingBonus.toLocaleString()} PLS`
                      : '';
                    return [`${props.payload.numEntries} tickets purchased\n${value.toLocaleString()} PLS${bonusText}${pendingText}`];
                  }
                  return [''];
                }}
              />
              <Line 
                yAxisId="pls"
                type="monotone" 
                dataKey="prizePool" 
                name="Prize Pool"
                dot={false} 
                strokeWidth={2} 
                stroke="#55FF9F" 
                activeDot={{ r: 4, fill: '#55FF9F', stroke: 'white' }}
              />
              <Bar
                yAxisId="transactions"
                dataKey="transactions"
                name="Transactions"
                fill="#55FF9F"
                opacity={0.3}
                maxBarSize={40}
                stackId="transactions"
                isAnimationActive={true}
                animationDuration={500}
                animationBegin={0}
                animationEasing="ease-out"
                style={{ transformOrigin: 'center bottom' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default PrizePoolChart; 