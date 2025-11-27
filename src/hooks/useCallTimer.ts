/**
 * useCallTimer Hook - Call Duration Tracking
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseCallTimerReturn {
  callDuration: number;
  callDurationString: string;
  startTimer: (startTime?: number) => void;
  stopTimer: () => void;
  resetTimer: () => void;
  isRunning: boolean;
}

/**
 * Format seconds to HH:MM:SS string
 */
const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
  const seconds = totalSeconds - hours * 3600 - minutes * 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

export const useCallTimer = (): UseCallTimerReturn => {
  const [callDuration, setCallDuration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  /**
   * Start the timer
   */
  const startTimer = useCallback((startTime?: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    startTimeRef.current = startTime || Date.now();
    setIsRunning(true);
    setCallDuration(0);

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setCallDuration(elapsed);
      }
    }, 1000);
  }, []);

  /**
   * Stop the timer
   */
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  /**
   * Reset the timer
   */
  const resetTimer = useCallback(() => {
    stopTimer();
    setCallDuration(0);
    startTimeRef.current = null;
  }, [stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    callDuration,
    callDurationString: formatDuration(callDuration),
    startTimer,
    stopTimer,
    resetTimer,
    isRunning,
  };
};
