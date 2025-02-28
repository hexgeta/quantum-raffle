import React, { useState, useRef, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle dropdown open/close
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Handle option selection
  const handleSelect = (interval: TimeInterval) => {
    if (interval !== selectedInterval) {
      onIntervalChange(interval);
    }
    setIsOpen(false);
  };

  // Get display text for the selected interval
  const getDisplayText = () => {
    switch (selectedInterval) {
      case 'hour': return 'Hourly';
      case '30min': return '30 Minutes';
      case '10min': return '10 Minutes';
      default: return 'Hourly';
    }
  };

  return (
    <div className="flex items-center relative" ref={dropdownRef}>
      <span className="text-white/60 text-sm mr-2 hidden sm:inline">Time Interval:</span>
      
      {/* Custom dropdown trigger button */}
      <button 
        onClick={toggleDropdown}
        className="flex items-center bg-black text-white border border-white/20 hover:bg-white/10 hover:text-white rounded-full px-4 py-1 text-sm"
      >
        <Clock className="mr-2 h-4 w-4 text-[#55FF9F]" />
        {getDisplayText()}
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>
      
      {/* Custom dropdown menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 z-50 min-w-[8rem] overflow-hidden rounded-md border border-white/20 bg-[#0D0D0D] p-1 text-white shadow-md">
          <div 
            className={`flex items-center px-2 py-1.5 rounded-sm hover:bg-white/10 cursor-pointer ${selectedInterval === 'hour' ? 'bg-white/20' : ''}`}
            onClick={() => handleSelect('hour')}
          >
            <Clock className="mr-2 h-4 w-4" />
            <span>Hourly</span>
            {selectedInterval === 'hour' && <span className="ml-2 h-2 w-2 rounded-full bg-[#55FF9F]"></span>}
          </div>
          
          <div 
            className={`flex items-center px-2 py-1.5 rounded-sm hover:bg-white/10 cursor-pointer ${selectedInterval === '30min' ? 'bg-white/20' : ''}`}
            onClick={() => handleSelect('30min')}
          >
            <Clock className="mr-2 h-4 w-4" />
            <span>30 Minutes</span>
            {selectedInterval === '30min' && <span className="ml-2 h-2 w-2 rounded-full bg-[#55FF9F]"></span>}
          </div>
          
          <div 
            className={`flex items-center px-2 py-1.5 rounded-sm hover:bg-white/10 cursor-pointer ${selectedInterval === '10min' ? 'bg-white/20' : ''}`}
            onClick={() => handleSelect('10min')}
          >
            <Clock className="mr-2 h-4 w-4" />
            <span>10 Minutes</span>
            {selectedInterval === '10min' && <span className="ml-2 h-2 w-2 rounded-full bg-[#55FF9F]"></span>}
          </div>
        </div>
      )}
    </div>
  );
} 