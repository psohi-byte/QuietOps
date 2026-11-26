// Game state machine: loading -> intro -> playing -> result
// (or "maintenance" if the kill switch is off).
// The dashboard, answer and result screens are placeholders. They get replaced as each one is built.
import { useEffect, useState } from 'react';
import {
  initFlagsmith,
  isGameEnabled,
  getGameConfig,
  getDashboardVariant,
} from './lib/flagsmith.js';

// ResultScreen.jsx is Michael's file. It's loaded optionally, so the app still builds
// before his file exists, and picks it up automatically once it does.
const optionalModules = import.meta.glob('./components/game/ResultScreen.jsx', { eager: true });
const ResultScreen =
  optionalModules['./components/game/ResultScreen.jsx']?.default ?? PlaceholderResult;

function PlaceholderResult({ correct, seconds, rootCause, timedOut, onPlayAgain }) {
  return (
    <main className="center">
      <h1>{timedOut ? 'Out of time' : correct ? 'Correct!' : 'Wrong'}</h1>
      <p>Root cause: <code>{rootCause}</code> · {seconds}s</p>
      <button onClick={onPlayAgain}>Play again</button>
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

  useEffect(() => {
    initFlagsmith().then(() => {
      setConfig(getGameConfig());
      setScreen(isGameEnabled() ? 'intro' : 'maintenance');
    });
  }, []);

  function start() {
    // Read the experiment flag only when the dashboard is about to show, so exposure = really saw it.
    setVariant(getDashboardVariant());
    setScreen('playing');
  }

  if (screen === 'loading') return <main className="center">Connecting…</main>;

  if (screen === 'maintenance') {
    return (
      <main className="center">
        <h1>QuietOps is under maintenance</h1>
        <p>We'll be back shortly.</p>
      </main>
    );
  }

  if (screen === 'intro') {
    return (
      <main className="center">
        <h1>QuietOps</h1>
        <p>{config.introText}</p>
        <button onClick={start}>Start incident</button>
      </main>
    );
  }

  return (
    <main className="center">
      <p>Dashboard placeholder. Variant: <code>{variant}</code></p>
      <button onClick={() => setScreen('intro')}>Back</button>
    </main>
  );
}
