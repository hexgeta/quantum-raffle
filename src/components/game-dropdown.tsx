import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from "lucide-react";

interface GameDropdownProps {
  selectedGame: string;
  onGameChange: (gameId: string) => void;
  gameIds: number[];
}

export function GameDropdown({ 
  selectedGame, 
  onGameChange,
  gameIds
}: GameDropdownProps) {
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
  const handleSelect = (gameId: string) => {
    if (gameId !== selectedGame) {
      onGameChange(gameId);
    }
    setIsOpen(false);
  };

  // Get display text for the selected game
  const getDisplayText = () => {
    if (selectedGame === 'all') return 'All Games';
    return `Game ${selectedGame}`;
  };

  return (
    <div className="relative w-[180px]" ref={dropdownRef}>
      {/* Custom dropdown trigger button */}
      <button 
        onClick={toggleDropdown}
        className="w-full h-10 bg-black text-white border border-white/20 hover:bg-white/10 hover:text-white rounded-[100px] flex items-center justify-between px-3"
      >
        <span>{getDisplayText()}</span>
        <ChevronDown className="h-4 w-4 ml-2" />
      </button>
      
      {/* Custom dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] w-full overflow-hidden rounded-md border border-white/20 bg-black p-1 text-white shadow-md">
          <div 
            className={`flex items-center px-2 py-1.5 rounded-sm hover:bg-white/10 cursor-pointer ${selectedGame === 'all' ? 'bg-white/20' : ''}`}
            onClick={() => handleSelect('all')}
          >
            <span>All Games</span>
            {selectedGame === 'all' && <span className="ml-auto h-3.5 w-3.5">✓</span>}
          </div>
          
          {gameIds
            .sort((a, b) => a - b)
            .map((gameId) => (
              <div 
                key={gameId}
                className={`flex items-center px-2 py-1.5 rounded-sm hover:bg-white/10 cursor-pointer ${selectedGame === gameId.toString() ? 'bg-white/20' : ''}`}
                onClick={() => handleSelect(gameId.toString())}
              >
                <span>Game {gameId}</span>
                {selectedGame === gameId.toString() && <span className="ml-auto h-3.5 w-3.5">✓</span>}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
} 