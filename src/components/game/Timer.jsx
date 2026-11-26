// Countdown. Remaining time is worked out from the start timestamp (not by counting
// ticks), so it stays accurate even if the browser throttles the interval.
import { useEffect, useState } from 'react';

export default function Timer({ startedAt, totalSeconds, onExpire }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, totalSeconds - (now - startedAt) / 1000);

  useEffect(() => {
    if (remaining <= 0) onExpire();
  }, [remaining <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const urgent = remaining <= 10;
  const secs = Math.ceil(remaining);
  const label = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  return (
    <div className={`timer ${urgent ? 'urgent' : ''}`} role="timer" aria-live="off" aria-label={`${secs} seconds left`}>
      <span className="timer-label">time left</span>
      <span className="timer-value">{label}</span>
    </div>
  );
}
