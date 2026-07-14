import { useEffect, useState } from 'react';

function millisecondsUntilTomorrow(date: Date): number {
  const tomorrow = new Date(date);
  tomorrow.setHours(24, 0, 0, 50);
  return Math.max(0, tomorrow.getTime() - date.getTime());
}

export function useCurrentDate(): Date {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    let timeoutId: number;

    const scheduleNextDay = () => {
      const now = new Date();
      timeoutId = window.setTimeout(() => {
        setCurrentDate(new Date());
        scheduleNextDay();
      }, millisecondsUntilTomorrow(now));
    };

    scheduleNextDay();
    return () => window.clearTimeout(timeoutId);
  }, []);

  return currentDate;
}
