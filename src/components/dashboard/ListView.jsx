// Variant A (control): a traditional alert feed. Every alert in one list,
// newest first, like most paging and notification tools.
import AlertRow from './AlertRow.jsx';

export default function ListView({ incident }) {
  const alerts = [...incident.alerts].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Alerts</h2>
        <span className="muted">{alerts.length} firing · newest first</span>
      </header>
      <ul className="alert-list">
        {alerts.map((a) => (
          <AlertRow key={a.id} alert={a} />
        ))}
      </ul>
    </section>
  );
}
