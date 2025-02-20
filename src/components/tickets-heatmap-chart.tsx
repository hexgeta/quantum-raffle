import React, { useEffect, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer
} from 'recharts';

interface HeatmapData {
  hour: number;
  day: number;
  value: number;
  date: string;
  tickets: number[];
}

interface Props {
  events: any[];
  isLoading: boolean;
}

function TicketsHeatmapChart({ events, isLoading }: Props) {
  const [chartData, setChartData] = useState<HeatmapData[]>([]);
  const [isRendered, setIsRendered] = useState(false);
  const [maxValue, setMaxValue] = useState(0);
  const [totalDays, setTotalDays] = useState(0);

  useEffect(() => {
    if (events.length > 0) {
      // Create a map to store tickets by hour and day
      const ticketsByTime = new Map<string, number[]>();
      
      // Get the earliest timestamp to calculate relative days
      const timestamps = events.map(e => {
        const date = new Date(e.timestamp);
        return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 
                       date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
      });
      const earliestTimestamp = Math.min(...timestamps);
      const startDate = new Date(earliestTimestamp);
      startDate.setUTCHours(0, 0, 0, 0); // Normalize to start of UTC day
      
      // Process events to get tickets by hour and day
      events.forEach(event => {
        const date = new Date(event.timestamp);
        const hour = date.getUTCHours();
        const dayDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const key = `${dayDiff}-${hour}`;
        
        // Store all ticket numbers for this hour/day combination
        const existingTickets = ticketsByTime.get(key) || [];
        const newTickets = Array.from({ length: event.numEntries }, (_, i) => i + 1);
        ticketsByTime.set(key, [...existingTickets, ...newTickets]);
      });

      // Create data points for each hour of each day
      const heatmapData: HeatmapData[] = [];
      let maxTickets = 0;

      // Get the number of days in the dataset
      const days = Math.max(...Array.from(ticketsByTime.keys()).map(key => parseInt(key.split('-')[0]))) + 1;
      setTotalDays(days);

      // Create data points for every day and hour
      for (let day = 0; day < days; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const key = `${day}-${hour}`;
          const tickets = ticketsByTime.get(key) || [];
          const value = tickets.length;
          maxTickets = Math.max(maxTickets, value);

          const date = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000);
          const formattedDate = date.toLocaleString('en-US', {
            timeZone: 'UTC',
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: date.getUTCMinutes() === 0 ? undefined : '2-digit',
            hour12: true
          }) + ' UTC';
          
          heatmapData.push({
            hour,
            day,
            value,
            date: formattedDate,
            tickets
          });
        }
      }

      setMaxValue(maxTickets);
      setChartData(heatmapData);
      
      setTimeout(() => {
        setIsRendered(true);
      }, 500);
    } else {
      setChartData([]);
      setTotalDays(0);
      setIsRendered(true);
    }
  }, [events]);

  // Reset rendered state when loading changes
  useEffect(() => {
    if (isLoading) {
      setIsRendered(false);
    }
  }, [isLoading]);

  // Custom tooltip content
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0D0D0D] border border-white/20 rounded-lg p-3 shadow-lg">
          <p className="text-white mb-2">{data.date}</p>
          <p className="text-white">{data.value.toLocaleString()} tickets</p>
        </div>
      );
    }
    return null;
  };

  // If no data, show empty state
  if (isRendered && chartData.length === 0) {
    return (
      <div className="w-full h-[450px] relative py-4">
        <div className="w-full h-full p-5 border border-white/20 rounded-[15px] flex items-center justify-center">
          <p className="text-white/40">No ticket data available for this game</p>
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
            {[...Array(24)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1 bg-white/10 rounded-t mx-1"
                style={{ height: '40%' }} 
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full h-full px-10 py-8 border border-white/20 rounded-[15px]">
          <h2 className="text-left text-white text-2xl mb-0 ml-10">
            Ticket Distribution by Hour (UTC)
          </h2>
          <ResponsiveContainer width="100%" height="88%">
            <ScatterChart
              margin={{ top: 30, right: 40, bottom: 40, left: 80 }}
            >
              <XAxis
                dataKey="hour"
                type="number"
                domain={[0, 23]}
                tickCount={24}
                tick={{ fill: '#888', fontSize: 12 }}
                tickFormatter={(hour) => `${hour}h`}
                orientation="top"
                axisLine={false}
                tickLine={false}
                dy={-12}
              />
              <YAxis
                dataKey="day"
                type="number"
                domain={[0, totalDays - 1]}
                tick={{ fill: '#888', fontSize: 12 }}
                tickFormatter={(day) => `Day ${day + 1}`}
                reversed
                axisLine={false}
                tickLine={false}
                dx={-20}
                interval={0}
                ticks={Array.from({ length: totalDays }, (_, i) => i)}
              />
              <ZAxis
                dataKey="value"
                type="number"
                range={[250, 250]} // Smaller squares for better spacing
                domain={[0, maxValue]}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={false} // Remove hover highlight completely
              />
              <Scatter
                data={chartData}
                shape={(props: any) => {
                  const { cx, cy, width, height, value } = props;
                  
                  // Use a logarithmic scale for better distribution
                  const getOpacity = (value: number, max: number) => {
                    if (value === 0) return 0;
                    
                    // Minimum opacity for non-zero values
                    const minOpacity = 0.15;
                    
                    // Use log scale to compress high values and expand low values
                    const logValue = Math.log(value + 1);
                    const logMax = Math.log(max + 1);
                    
                    // Scale between minOpacity and 1
                    return minOpacity + ((logValue / logMax) * (1 - minOpacity));
                  };

                  return (
                    <rect
                      x={cx - width / 2}
                      y={cy - height / 2}
                      width={width}
                      height={height}
                      rx={4}
                      ry={4}
                      fill={value === 0 ? 'transparent' : '#55FF9F'}
                      fillOpacity={getOpacity(value, maxValue)}
                      style={{ transition: 'all 200ms ease-in-out' }}
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="flex items-center justify-end mt-0 mr-10 space-x-2">
            <span className="text-white/40 text-sm">Less</span>
            {[0.15, 0.3, 0.5, 0.75, 1].map((opacity) => (
              <div
                key={opacity}
                className="w-4 h-4 rounded"
                style={{
                  backgroundColor: '#55FF9F',
                  opacity: opacity,
                }}
              />
            ))}
            <span className="text-white/40 text-sm">More</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketsHeatmapChart; 