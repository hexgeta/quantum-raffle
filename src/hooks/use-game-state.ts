import { useState, useEffect } from 'react';

export function useGameState(contract: any, gameId: number) {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkGameState() {
      if (!contract) return;

      try {
        const isOver = await contract.isGameOver(gameId);
        if (isMounted) {
          // isGameOver returns true when game is over, false when active
          setIsActive(!isOver); // If game is over (true), then it's not active
          console.log('Game', gameId, isOver ? 'is complete' : 'is active');
        }
      } catch (error) {
        console.error('Error checking game state:', error);
        if (isMounted) {
          // If there's an error, assume the game is active
          setIsActive(true);
          console.log('Game', gameId, 'is active (error checking state)');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkGameState();

    return () => {
      isMounted = false;
    };
  }, [contract, gameId]);

  return { isActive, isLoading };
} 