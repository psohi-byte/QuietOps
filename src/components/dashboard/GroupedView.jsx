// Variant B ("grouped"): related alerts are consolidated into clusters, and a
// dependency map shows which services in the selected cluster are alerting.
// Clusters are labelled neutrally ("Cluster 1"). The view never says which
// service is the root cause; the player still has to work it out.
import { useState } from 'react';
import AlertRow from './AlertRow.jsx';
import DependencyMap from './DependencyMap.jsx';

function buildClusters(incident) {
  return incident.groups
    .map((g) => {
      // Oldest first inside a cluster, so you can read how the incident unfolded.
      const alerts = incident.alerts
        .filter((a) => a.group === g.id)
        .sort((a, b) => a.time.localeCompare(b.time));
      const services = [...new Set(alerts.map((a) => a.service))];
      return { ...g, alerts, services, startedAt: alerts[0]?.time };
    })
    .filter((c) => c.alerts.length > 0)
    .sort((a, b) => b.alerts.length - a.alerts.length);
}

export default function GroupedView({ incident }) {
  const clusters = buildClusters(incident);
  const [selectedId, setSelectedId] = useState(clusters[0]?.id);
  const selected = clusters.find((c) => c.id === selectedId) ?? clusters[0];

  // Alert counts per service, for the selected cluster only.
  const counts = {};
  for (const a of selected.alerts) counts[a.service] = (counts[a.service] ?? 0) + 1;

  return (
    <div className="grouped">
      <section className="panel">
        <header className="panel-head">
          <h2>Dependency map</h2>
          <span className="muted">{selected.label}: alerting services in red · arrows point to what a service depends on</span>
        </header>
        <DependencyMap services={incident.services} counts={counts} />
      </section>

      <section className="panel">
        <header className="panel-head">
          <h2>Alert clusters</h2>
          <span className="muted">{incident.alerts.length} alerts in {clusters.length} clusters</span>
        </header>
        <div className="clusters">
          {clusters.map((c) => {
            const open = c.id === selected.id;
            return (
              <div key={c.id} className={`cluster ${open ? 'open' : ''}`}>
                <button
                  className="cluster-head"
                  onClick={() => setSelectedId(c.id)}
                  aria-expanded={open}
                >
                  <strong>{c.label}</strong>
                  <span className="muted">
                    {c.alerts.length} alerts · {c.services.length} services · started {c.startedAt}
                  </span>
                  <span className="cluster-services">
                    {c.services.map((s) => (
                      <span key={s} className="chip">{s}</span>
                    ))}
                  </span>
                </button>
                {open && (
                  <ul className="alert-list">
                    {c.alerts.map((a) => (
                      <AlertRow key={a.id} alert={a} />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
