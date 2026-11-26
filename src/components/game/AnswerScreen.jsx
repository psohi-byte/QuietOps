// The diagnosis prompt. It opens over the dashboard and the timer keeps running.
// The player can close it and go back to the alerts.
export default function AnswerScreen({ choices, onAnswer, onClose }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="answer-title">
      <div className="answer-card">
        <h2 id="answer-title">What's the root cause?</h2>
        <p className="muted">Pick the service that caused this outage. The clock is still running.</p>
        <div className="choices">
          {choices.map((c) => (
            <button key={c} className="choice" onClick={() => onAnswer(c)}>
              <code>{c}</code>
            </button>
          ))}
        </div>
        <button className="link" onClick={onClose}>← Back to alerts</button>
      </div>
    </div>
  );
}
