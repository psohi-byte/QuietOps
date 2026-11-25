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

export default function App() {
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
        <h1>SignalZero is under maintenance</h1>
        <p>We'll be back shortly.</p>
      </main>
    );
  }

  if (screen === 'intro') {
    return (
      <main className="center">
        <h1>SignalZero</h1>
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
