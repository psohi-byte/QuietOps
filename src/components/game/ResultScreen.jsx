import './ResultScreen.css';
import { useEffect, useRef, useState } from 'react';

export default function ResultScreen({
  correct,
  seconds,
  rootCause,
  timedOut = false,
  onPlayAgain,
  players,
}) {
  const [shareStatus, setShareStatus] = useState('');
  const copyTimer = useRef();
  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const outcome = timedOut ? 'timeout' : correct ? 'correct' : 'wrong';
  const headline = {
    correct: 'Root cause found',
    wrong: 'Wrong call',
    timeout: 'Out of time',
  }[outcome];
  const text = outcome === 'correct'
    ? `I found the root cause of a production outage in ${seconds}s on QuietOps. Can you beat it? (no spoilers!)`
    : "Production went down and I couldn't find the root cause in time. Can you? QuietOps (no spoilers!)";
  const url = window.location.origin;
  const shareText = `${text} ${url}`;

  async function shareResult() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'QuietOps', text, url });
      } catch {
        // Closing the native share sheet needs no feedback.
      }
      return;
    }

    window.clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(shareText);
      setShareStatus('copied');
      copyTimer.current = window.setTimeout(() => setShareStatus(''), 2000);
    } catch {
      setShareStatus('manual');
    }
  }

  return (
    <section className="result-card" aria-labelledby="result-title">
      {outcome === 'correct' && (
        <div className="result-confetti" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => (
            <span
              key={index}
              style={{
                '--result-drift': `${(index - 8.5) * 5}%`,
                '--result-rise': `${35 + (index % 5) * 14}px`,
                '--result-delay': `${(index % 4) * 45}ms`,
                '--result-spin': `${index % 2 === 0 ? 240 : -240}deg`,
              }}
            />
          ))}
        </div>
      )}
      <h1 id="result-title" className={`result-title result-title-${outcome}`}>{headline}</h1>
      {!timedOut && <p className="result-time">in {seconds}s</p>}
      <p>The real root cause was <code>{rootCause}</code>.</p>
      <p className="result-context">
        During an outage, most alerts are symptoms of the same underlying problem.
      </p>
      <div className="result-invite">
        {typeof players === 'number' && (
          <p>You're one of {players} on-call engineers who took this shift.</p>
        )}
        <p className="result-challenge">Can your friends beat 60 seconds?</p>
      </div>
      <div className="result-actions">
        <button type="button" onClick={shareResult}>
          {shareStatus === 'copied' ? 'Copied!' : 'Share'}
        </button>
        <button type="button" onClick={onPlayAgain}>Play again</button>
      </div>
      <div role="status">
        {shareStatus === 'copied' && <span className="result-announcement">Copied to clipboard.</span>}
        {shareStatus === 'manual' && (
          <label className="result-copy">
            Copy this message to share your result
            <textarea readOnly rows={4} value={shareText} onFocus={(event) => event.currentTarget.select()} />
          </label>
        )}
      </div>
    </section>
  );
}
