// The 2 AM page: a phone-lockscreen-style notification, then "Acknowledge" starts the round.
// Same for both variants (the variant is only read when the console appears).
export default function Intro({ title, alertCount, introText, timerSeconds, onStart }) {
  return (
    <main className="intro">
      <div className="lockscreen">
        <div className="lock-time">2:16</div>
        <div className="lock-date">Thursday · on-call</div>

        <div className="pager-card" role="alert">
          <div className="pager-top">
            <span className="pager-app">
              <span className="logo-dot" aria-hidden="true" /> QuietOps
            </span>
            <span className="pager-when">now</span>
          </div>
          <div className="pager-title">
            <span className="sev-badge">SEV-1</span> {title}
          </div>
          <div className="pager-body">{alertCount} alerts firing · you are primary on-call</div>
        </div>
      </div>

      <div className="intro-copy">
        <p className="intro-text">{introText}</p>
        <ol className="intro-steps">
          <li>Alerts are firing across the stack. Most of them are symptoms.</li>
          <li>Find the one service that caused the rest.</li>
          <li>
            Hit <strong>Diagnose</strong> and make the call before {timerSeconds}s run out.
          </li>
        </ol>
        <button className="primary big" onClick={onStart} autoFocus>
          Acknowledge
        </button>
      </div>
    </main>
  );
}
