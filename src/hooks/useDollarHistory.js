import { useState } from 'react';
import { dollarHistoryApi } from '../api/dollarHistoryApi';

export function useDollarHistory() {
  const [isLoading, setIsLoading] = useState(false);

  const getHistoricalRate = async (date) => {
    setIsLoading(true);
    try {
      const rate = await dollarHistoryApi.getHistoricalRate(date);
      return rate;
    } catch (error) {
      console.error('Error obteniendo cotización histórica:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentRate = async () => {
    setIsLoading(true);
    try {
      const rate = await dollarHistoryApi.getCurrentRate();
      return rate;
    } catch (error) {
      console.error('Error obteniendo cotización actual:', error);
      return 1200; // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getHistoricalRate,
    getCurrentRate,
    isLoading
  };
}
