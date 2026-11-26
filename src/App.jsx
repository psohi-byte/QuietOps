// Game state machine:
//   loading -> intro -> playing (dashboard + optional answer overlay) -> result -> intro ...
//   loading -> maintenance   (if the kill switch flag is off)
import { useEffect, useRef, useState } from 'react';
import incident from '../data/incident.json';
import {
  initFlagsmith,
  isGameEnabled,
  getGameConfig,
  getDashboardVariant,
  startRound,
  track,
  EVENTS,
} from './lib/flagsmith.js';
import Intro from './components/game/Intro.jsx';
import Timer from './components/game/Timer.jsx';
import AnswerScreen from './components/game/AnswerScreen.jsx';
import ListView from './components/dashboard/ListView.jsx';
import GroupedView from './components/dashboard/GroupedView.jsx';

// ResultScreen.jsx is Michael's file. It's loaded optionally, so the app still builds
// before his file exists, and picks it up automatically once it does.
const optionalModules = import.meta.glob('./components/game/ResultScreen.jsx', { eager: true });
const ResultScreen =
  optionalModules['./components/game/ResultScreen.jsx']?.default ?? PlaceholderResult;

function PlaceholderResult({ correct, seconds, rootCause, timedOut, onPlayAgain }) {
  return (
    <main className="center">
      <h1>{timedOut ? 'Out of time' : correct ? 'Root cause found' : 'Wrong call'}</h1>
      <p>
        The real root cause was <code>{rootCause}</code>
        {!timedOut && <> · {seconds}s</>}
      </p>
      <button className="primary" onClick={onPlayAgain}>Play again</button>
    </main>
  );
}

// Dev preview so the result screen can be tested on its own, e.g.
//   http://localhost:5173/?preview=result&correct=1&seconds=23
//   http://localhost:5173/?preview=result&timedout=1
function ResultPreview() {
  const q = new URLSearchParams(window.location.search);
  return (
    <ResultScreen
      correct={q.get('correct') === '1'}
      timedOut={q.get('timedout') === '1'}
      seconds={Number(q.get('seconds') ?? 60)}
      rootCause={q.get('rootCause') ?? 'db-primary'}
      onPlayAgain={() => console.log('[preview] play again clicked')}
    />
  );
}

const DEBUG = new URLSearchParams(window.location.search).has('debug');

export default function App() {
  if (new URLSearchParams(window.location.search).get('preview') === 'result') {
    return <ResultPreview />;
  }
  return <Game />;
}

function Game() {
  const [screen, setScreen] = useState('loading');
  const [config, setConfig] = useState(null);
  const [variant, setVariant] = useState(null);
  const [startedAt, setStartedAt] = useState(0);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [result, setResult] = useState(null);
  const round = useRef(null); // { round, counted }
  const finished = useRef(false);

  useEffect(() => {
    initFlagsmith().then(() => {
      setConfig(getGameConfig());
      setScreen(isGameEnabled() ? 'intro' : 'maintenance');
    });
  }, []);

  function start() {
    // Read the experiment flag only now, as the dashboard appears, so an exposure
    // means the player really saw that variant.
    setVariant(getDashboardVariant());
    round.current = startRound();
    finished.current = false;
    setAnswerOpen(false);
    setStartedAt(Date.now());
    setScreen('playing');
    window.scrollTo(0, 0);
  }

  // answer = chosen service id, or null when the timer ran out.
  function finish(answer) {
    if (finished.current) return; // guard: timer expiry and a click can race
    finished.current = true;

    const timedOut = answer === null;
    const correct = answer === incident.rootCause;
    const seconds = Math.min(config.timerSeconds, Math.round((Date.now() - startedAt) / 1000));

    if (round.current?.counted) {
      const event = timedOut ? EVENTS.TIMED_OUT : correct ? EVENTS.CORRECT : EVENTS.INCORRECT;
      track(event, { value: seconds, metadata: { variant, answer, seconds } });
    }

    setResult({ correct, seconds, timedOut });
    setScreen('result');
    window.scrollTo(0, 0);
  }

  if (screen === 'loading') return <main className="center muted">Connecting…</main>;

  if (screen === 'maintenance') {
    return (
      <main className="center">
        <h1>QuietOps is under maintenance</h1>
        <p className="muted">We're fixing something (for real this time). Back shortly.</p>
      </main>
    );
  }

  if (screen === 'intro') {
    return <Intro introText={config.introText} timerSeconds={config.timerSeconds} onStart={start} />;
  }

  if (screen === 'result') {
    return (
      <ResultScreen
        correct={result.correct}
        seconds={result.seconds}
        timedOut={result.timedOut}
        rootCause={incident.rootCause}
        onPlayAgain={() => setScreen('intro')}
      />
    );
  }

  // screen === 'playing'
  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <div className="sev">SEV-1</div>
          <h1 className="incident-title">{incident.scenario.replace(/^SEV-1:\s*/, '')}</h1>
          <p className="muted small">{incident.summary}</p>
        </div>
        <div className="topbar-actions">
          <Timer startedAt={startedAt} totalSeconds={config.timerSeconds} onExpire={() => finish(null)} />
          <button className="primary" onClick={() => setAnswerOpen(true)}>Diagnose</button>
        </div>
      </header>

      {DEBUG && <p className="debug">variant: <code>{variant}</code> · round {round.current?.round} · counted: {String(round.current?.counted)}</p>}

      {variant === 'grouped' ? <GroupedView incident={incident} /> : <ListView incident={incident} />}

      {answerOpen && (
        <AnswerScreen choices={incident.choices} onAnswer={finish} onClose={() => setAnswerOpen(false)} />
      )}
    </div>
  );
}
