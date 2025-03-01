import { useEffect, useState } from "react";

export const useTriggerAutoRefresh = () => {
  // Add state to trigger re-renders
  const [, setTick] = useState(0);

  useEffect(() => {
    // Set up an interval that updates every 5 seconds
    const interval = setInterval(() => {
      setTick((tick) => tick + 1);
    }, 5000);

    // Clean up the interval when component unmounts
    return () => clearInterval(interval);
  }, []);
};