export default function Intro({ introText, timerSeconds, onStart }) {
  return (
    <main className="center intro">
      <div className="pager">PAGER · SEV-1 · 02:16 AM</div>
      <h1>QuietOps</h1>
      <p className="intro-text">{introText}</p>
      <ol className="intro-steps">
        <li>Alerts are firing across the stack. Most of them are symptoms.</li>
        <li>Find the one service that caused the rest.</li>
        <li>Hit <strong>Diagnose</strong> and make the call before {timerSeconds}s run out.</li>
      </ol>
      <button className="primary big" onClick={onStart}>Acknowledge &amp; start</button>
    </main>
  );
}
