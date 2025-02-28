import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Clock, ChevronDown } from "lucide-react";

export type TimeInterval = 'hour' | '30min' | '10min';

interface TimeIntervalFilterProps {
  selectedInterval: TimeInterval;
  onIntervalChange: (interval: TimeInterval) => void;
}

export function TimeIntervalFilter({ 
  selectedInterval, 
  onIntervalChange 
}: TimeIntervalFilterProps) {
  return (
    <div className="flex items-center">
      <span className="text-white/60 text-sm mr-2 hidden sm:inline">Time Interval:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-black text-white border border-white/20 hover:bg-white/10 hover:text-white rounded-full px-4"
            size="sm"
          >
            <Clock className="mr-2 h-4 w-4 text-[#55FF9F]" />
            {selectedInterval === 'hour' ? 'Hourly' : 
             selectedInterval === '30min' ? '30 Minutes' : '10 Minutes'}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#0D0D0D] border border-white/20 text-white">
          <DropdownMenuItem 
            className={`hover:bg-white/10 cursor-pointer ${selectedInterval === 'hour' ? 'bg-white/20' : ''}`}
            onClick={() => onIntervalChange('hour')}
          >
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>Hourly</span>
              {selectedInterval === 'hour' && <span className="ml-2 h-2 w-2 rounded-full bg-[#55FF9F]"></span>}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={`hover:bg-white/10 cursor-pointer ${selectedInterval === '30min' ? 'bg-white/20' : ''}`}
            onClick={() => onIntervalChange('30min')}
          >
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>30 Minutes</span>
              {selectedInterval === '30min' && <span className="ml-2 h-2 w-2 rounded-full bg-[#55FF9F]"></span>}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={`hover:bg-white/10 cursor-pointer ${selectedInterval === '10min' ? 'bg-white/20' : ''}`}
            onClick={() => onIntervalChange('10min')}
          >
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>10 Minutes</span>
              {selectedInterval === '10min' && <span className="ml-2 h-2 w-2 rounded-full bg-[#55FF9F]"></span>}
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 