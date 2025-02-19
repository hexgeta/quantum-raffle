'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface ChartData {
  timestamp: string;
  prizePool: number;
}

interface Props {
  events: any[];
  isLoading: boolean;
}

function PrizePoolChart({ events, isLoading }: Props) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  const [visibleLines, setVisibleLines] = useState({
    prizePool: true,
  });

  useEffect(() => {
    if (events.length > 0) {
      // Process events to create time series data
      const timeSeriesData = events
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(event => ({
          timestamp: event.timestamp,
          prizePool: parseFloat(event.prizePool)
        }));

      setChartData(timeSeriesData);
    }
  }, [events]);

  const handleLegendClick = (dataKey: string) => {
    setVisibleLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  const customLegend = (props: any) => {
    const { payload } = props;
    
    if (payload && chartData?.length > 0) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          width: '100%', 
          marginTop: '35px' 
        }}>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center' 
          }}>
            {payload.map((entry: any, index: number) => (
              <li 
                key={`item-${index}`}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  marginRight: 20, 
                  marginBottom: 5,
                  cursor: 'pointer' 
                }}
                onClick={() => handleLegendClick(entry.dataKey)}
              >
                <span style={{ 
                  color: entry.color, 
                  marginRight: 5,
                  fontSize: '28px',
                  lineHeight: '18px',
                  display: 'flex',
                  alignItems: 'center'
                }}>●</span>
                <span style={{ 
                  color: visibleLines[entry.dataKey] ? '#fff' : '#888',
                  fontSize: '12px',
                  lineHeight: '12px'
                }}>
                  {entry.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full h-[450px] my-10 relative bg-black/40 border-none">
      {isLoading ? (
        <Skeleton className="w-full h-full rounded-[15px]" />
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
                tickLine={false}
                tick={{ fill: '#888', fontSize: 14, dy: 5 }}
                ticks={[chartData[0]?.timestamp, chartData[chartData.length - 1]?.timestamp]}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { 
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                }}
                label={{ 
                  value: 'TIME', 
                  position: 'bottom',
                  offset: 5,
                  style: { 
                    fill: '#888',
                    fontSize: 12,
                    marginTop: '0px',
                  }
                }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888', fontSize: 14, dx: -5}}
                tickFormatter={(value) => `${value.toFixed(2)} PLS`}
                label={{ 
                  value: 'PRIZE POOL (PLS)', 
                  position: 'left',
                  angle: -90,
                  offset: 0,
                  style: { 
                    fill: '#888',
                    fontSize: 12,
                    marginTop: '0px',
                  }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.85)', 
                  border: '1px solid rgba(255, 255, 255, 0.2)', 
                  borderRadius: '10px'
                }}
                labelStyle={{ color: 'white' }}
                itemStyle={{ color: 'white' }}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                }}
                formatter={(value: number) => [`${value.toFixed(2)} PLS`, 'Prize Pool']}
              />
              <Legend content={customLegend} />
              <Line 
                type="monotone" 
                dataKey="prizePool" 
                name="Prize Pool"
                dot={false} 
                strokeWidth={2} 
                stroke="#3991ED" 
                activeDot={{ r: 4, fill: '#3991ED', stroke: 'white' }}
                hide={!visibleLines.prizePool}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export default PrizePoolChart; 