import { useEffect, useRef, useState } from 'react';

/**
 * Milliseconds left until a server-clock deadline, plus the length of the countdown
 * when it started (for progress rings). Returns null when there is no deadline.
 */
export function useCountdown(deadline: number | null, clockOffset: number): { leftMs: number; totalMs: number } | null {
  const offset = useRef(clockOffset);
  offset.current = clockOffset;
  const [now, setNow] = useState(() => Date.now());
  const [totalMs, setTotalMs] = useState(1);

  useEffect(() => {
    if (deadline === null) return;
    setNow(Date.now());
    setTotalMs(Math.max(1, deadline - (Date.now() + offset.current)));
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [deadline]);

  if (deadline === null) return null;
  return { leftMs: Math.max(0, deadline - (now + clockOffset)), totalMs };
}
