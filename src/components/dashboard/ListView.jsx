// Variant A (control): a traditional alert feed. Every alert in one list,
// newest first, like most paging and notification tools.
// Only the visual style is shared with B; the layout is the thing being tested.
import AlertRow from './AlertRow.jsx';
import { staggerStep } from './stagger.js';

export default function ListView({ incident }) {
  const alerts = [...incident.alerts].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Alerts</h2>
        <span className="panel-meta">{alerts.length} firing · newest first</span>
      </header>
      <ul className="alert-list" style={{ '--step': staggerStep(alerts.length) }}>
        {alerts.map((a, i) => (
          <AlertRow key={a.id} alert={a} index={i} />
        ))}
      </ul>
    </section>
  );
}
