import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useBettingSlip = () => {
  const [selectedTips, setSelectedTips] = useState([]);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const { user, getAuthHeaders } = useAuth();

  const addTip = useCallback((tip) => {
    setSelectedTips(prev => {
      // Check if tip already exists
      const exists = prev.find(t => t.id === tip.id);
      if (exists) return prev;
      
      return [...prev, tip];
    });
    setIsSlipOpen(true);
  }, []);

  const removeTip = useCallback((tip) => {
    setSelectedTips(prev => prev.filter(t => t.id !== tip.id));
  }, []);

  const clearSlip = useCallback(() => {
    setSelectedTips([]);
    setIsSlipOpen(false);
  }, []);

  const placeBet = useCallback(async (betData) => {
    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          ...betData,
          userId: user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to place bet');
      }

      const result = await response.json();
      
      // Clear slip after successful bet
      clearSlip();
      
      return result;
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }, [user, getAuthHeaders, clearSlip]);

  return {
    selectedTips,
    isSlipOpen,
    setIsSlipOpen,
    addTip,
    removeTip,
    clearSlip,
    placeBet
  };
};