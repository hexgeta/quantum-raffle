'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useCryptoPrice } from '@/hooks/use-crypto-price';

interface ChartData {
  timestamp: string;
  prizePool: number;
  prizePoolUsd: number;
}

interface Props {
  events: any[];
  isLoading: boolean;
}

function PrizePoolChart({ events, isLoading }: Props) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isRendered, setIsRendered] = useState(false);
  const { priceData } = useCryptoPrice('PLS');

  useEffect(() => {
    if (events.length > 0 && priceData?.price) {
      // Process events to create time series data
      const timeSeriesData = events
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(event => ({
          timestamp: event.timestamp,
          prizePool: parseFloat(event.prizePool),
          prizePoolUsd: parseFloat(event.prizePool) * priceData.price
        }));

      setChartData(timeSeriesData);
      // Add a delay to ensure chart is fully rendered
      setTimeout(() => {
        setIsRendered(true);
      }, 500);
    }
  }, [events, priceData?.price]);

  // Reset rendered state when loading changes
  useEffect(() => {
    if (isLoading) {
      setIsRendered(false);
    }
  }, [isLoading]);

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
            <LineChart data={chartData} margin={{ top: 30, right: 20, left: 20, bottom: 30 }}>
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
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.85)', 
                  border: '1px solid rgba(255, 255, 255, 0.2)', 
                  borderRadius: '10px',
                  padding: '12px'
                }}
                labelStyle={{ color: 'white', marginBottom: '8px' }}
                itemStyle={{ color: 'white', whiteSpace: 'pre-line' }}
                separator=""
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                }}
                formatter={(value: any, name: string, props: any) => {
                  if (typeof value !== 'number') return '';
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
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default PrizePoolChart; 