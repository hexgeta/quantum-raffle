import React, { useEffect, useState, useRef } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { useSearchParams } from 'next/navigation';
import { TimeIntervalFilter, TimeInterval } from './time-interval-filter';

interface HeatmapData {
  hour: number;
  day: number;
  value: number;
  date: string;
  tickets: number[];
  // For 30-minute intervals
  halfHour?: number;
  // For 10-minute intervals
  minute?: number;
  timeSlot?: number;
  // Combined slot for time intervals (0-143 for 10min, 0-47 for 30min)
  combinedSlot?: number;
}

interface Props {
  events: any[];
  isLoading: boolean;
  onAddressSelect?: (address: string) => void;
}

function TicketsHeatmapChart({ events, isLoading, onAddressSelect }: Props) {
  const [chartData, setChartData] = useState<HeatmapData[]>([]);
  const [isRendered, setIsRendered] = useState(false);
  const [maxValue, setMaxValue] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('hour');
  const [isMobile, setIsMobile] = useState(false);
  const searchParams = useSearchParams();
  const chartRef = useRef<HTMLDivElement>(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      // Get selected address from URL
      const selectedAddress = searchParams.get('address');
      
      // Filter events if address is selected
      const filteredEvents = selectedAddress 
        ? events.filter(event => event.entrant === selectedAddress)
        : events;
      
      // Create a map to store tickets by time
      const ticketsByTime = new Map<string, number[]>();
      
      // Get the earliest timestamp to calculate relative days
      const timestamps = filteredEvents.map(e => {
        const date = new Date(e.timestamp);
        return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 
                       date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
      });
      const earliestTimestamp = Math.min(...timestamps);
      const startDate = new Date(earliestTimestamp);
      startDate.setUTCHours(0, 0, 0, 0); // Normalize to start of UTC day
      
      // Process events to get tickets by time
      filteredEvents.forEach(event => {
        const date = new Date(event.timestamp);
        const hour = date.getUTCHours();
        const minute = date.getUTCMinutes();
        const dayDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Create key based on time interval
        let key;
        if (timeInterval === 'hour') {
          key = `${dayDiff}-${hour}`;
        } else if (timeInterval === '30min') {
          const halfHour = minute < 30 ? 0 : 1; // 0 for first half, 1 for second half
          key = `${dayDiff}-${hour}-${halfHour}`;
        } else { // 10min interval
          const timeSlot = Math.floor(minute / 10); // 0-5 for each hour (0, 10, 20, 30, 40, 50)
          key = `${dayDiff}-${hour}-${timeSlot}`;
        }
        
        // Store all ticket numbers for this time combination
        const existingTickets = ticketsByTime.get(key) || [];
        const newTickets = Array.from({ length: event.numEntries }, (_, i) => i + 1);
        ticketsByTime.set(key, [...existingTickets, ...newTickets]);
      });

      // Create data points for each time slot
      const heatmapData: HeatmapData[] = [];
      let maxTickets = 0;

      // Get the number of days in the dataset
      const days = Math.max(...Array.from(ticketsByTime.keys()).map(key => parseInt(key.split('-')[0]))) + 1;
      setTotalDays(days);

      // Create data points based on time interval
      if (timeInterval === 'hour') {
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
              tickets,
              combinedSlot: hour // For hour view, combinedSlot is just the hour
            });
          }
        }
      } else if (timeInterval === '30min') {
        // Create data points for every day, hour, and 30-minute slot
        for (let day = 0; day < days; day++) {
          for (let hour = 0; hour < 24; hour++) {
            for (let halfHour = 0; halfHour < 2; halfHour++) {
              const key = `${day}-${hour}-${halfHour}`;
              const tickets = ticketsByTime.get(key) || [];
              const value = tickets.length;
              maxTickets = Math.max(maxTickets, value);

              const minute = halfHour * 30;
              const date = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000 + minute * 60 * 1000);
              const formattedDate = date.toLocaleString('en-US', {
                timeZone: 'UTC',
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }) + ' UTC';
              
              // Calculate combined slot (0-47) for the entire day
              const combinedSlot = hour * 2 + halfHour;
              
              heatmapData.push({
                hour,
                day,
                halfHour,
                combinedSlot,
                value,
                date: formattedDate,
                tickets
              });
            }
          }
        }
      } else { // 10min interval
        // Create data points for every day, hour, and 10-minute slot
        for (let day = 0; day < days; day++) {
          for (let hour = 0; hour < 24; hour++) {
            for (let timeSlot = 0; timeSlot < 6; timeSlot++) {
              const key = `${day}-${hour}-${timeSlot}`;
              const tickets = ticketsByTime.get(key) || [];
              const value = tickets.length;
              maxTickets = Math.max(maxTickets, value);

              const minute = timeSlot * 10;
              const date = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000 + minute * 60 * 1000);
              const formattedDate = date.toLocaleString('en-US', {
                timeZone: 'UTC',
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }) + ' UTC';
              
              // Calculate combined slot (0-143) for the entire day
              const combinedSlot = hour * 6 + timeSlot;
              
              heatmapData.push({
                hour,
                day,
                minute,
                timeSlot,
                combinedSlot,
                value,
                date: formattedDate,
                tickets
              });
            }
          }
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
  }, [events, searchParams, timeInterval]);

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

  // Format time for X-axis labels
  const formatTimeLabel = (value: number) => {
    if (timeInterval === 'hour') {
      // For hourly view, just show the hour
      return `${value}h`;
    } else if (timeInterval === '30min') {
      // For 30-minute intervals, convert the combined slot (0-47) to hour:minute
      const hour = Math.floor(value / 2);
      const minute = (value % 2) * 30;
      
      // Only show labels for full hours
      if (minute === 0) {
        return `${hour}h`;
      }
      return '';
    } else { // 10min interval
      // For 10-minute intervals, convert the combined slot (0-143) to hour:minute
      const hour = Math.floor(value / 6);
      const minute = (value % 6) * 10;
      
      // Only show labels for full hours
      if (minute === 0) {
        return `${hour}h`;
      }
      return '';
    }
  };

  // Get domain max based on time interval
  const getXAxisDomain = () => {
    if (timeInterval === 'hour') return [0, 23];
    if (timeInterval === '30min') return [0, 47];
    return [0, 143]; // 10min
  };

  // Get tick count based on time interval
  const getXAxisTickCount = () => {
    return 24; // Always show 24 ticks (one for each hour)
  };

  // Get ticks for X-axis to ensure every hour is shown
  const getXAxisTicks = () => {
    if (timeInterval === 'hour') {
      // For hourly view, show all 24 hours
      return Array.from({ length: 24 }, (_, i) => i);
    } else if (timeInterval === '30min') {
      // For 30-minute view, show only the hour marks (0, 2, 4, 6, etc. in combinedSlot units)
      return Array.from({ length: 24 }, (_, i) => i * 2);
    } else {
      // For 10-minute view, show only the hour marks (0, 6, 12, 18, etc. in combinedSlot units)
      return Array.from({ length: 24 }, (_, i) => i * 6);
    }
  };

  return (
    <div id="tickets-heatmap" className="w-full h-[450px] relative py-4" ref={chartRef}>
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
          <div className="flex justify-between items-center mb-4 ml-10 mr-10">
            <h2 className="text-left text-white text-2xl">
              Ticket Distribution by {timeInterval === 'hour' ? 'Hour' : timeInterval === '30min' ? '30 Minutes' : '10 Minutes'} (UTC)
            </h2>
            <TimeIntervalFilter 
              selectedInterval={timeInterval}
              onIntervalChange={setTimeInterval}
            />
          </div>
          <ResponsiveContainer width="100%" height={`${Math.min(88, 16 + totalDays * 8)}%`}>
            <ScatterChart
              margin={{ 
                top: 30, 
                right: timeInterval === 'hour' ? 40 : 20, 
                bottom: 20, 
                left: 80 
              }}
            >
              <XAxis
                dataKey="combinedSlot"
                type="number"
                domain={getXAxisDomain()}
                tickCount={getXAxisTickCount()}
                tick={{ fill: '#888', fontSize: isMobile ? 10 : 12 }}
                tickFormatter={(value) => formatTimeLabel(value)}
                orientation="top"
                axisLine={false}
                tickLine={false}
                dy={-12}
                ticks={getXAxisTicks()}
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
                range={[250, 250]}
                domain={[0, maxValue]}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={false}
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

                  // Calculate size based on time interval and screen size
                  let size = 0.8;
                  let widthMultiplier = 1.0;
                  
                  if (timeInterval === '30min') {
                    size = isMobile ? 0.7 : 0.7;
                    // Increase width for 30min view
                    widthMultiplier = 0.25;
                  } else if (timeInterval === '10min') {
                    size = isMobile ? 0.5 : 0.5;
                    // Increase width for 10min view
                    widthMultiplier = 0.25;
                  }
                    
                  const heightMultiplier = size;

                  return (
                    <rect
                      x={cx - width / 2}
                      y={cy - height / 2}
                      width={width * widthMultiplier}
                      height={height * heightMultiplier}
                      rx={timeInterval === 'hour' ? 4 : 2}
                      ry={timeInterval === 'hour' ? 4 : 2}
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