// Variant B ("grouped"): related alerts are consolidated into ONE incident, shown as
// one row per service, next to a blast-radius dependency map.
//
// Fairness rules (see docs/designs/on-call-console-redesign.md):
//  - Rows are ordered by alert COUNT, not by time. In this scenario the root cause is the
//    earliest service in the incident, so time ordering would give the answer away.
//  - Collapsed rows show no times. Times only appear on individual alerts once expanded,
//    exactly as the list view shows them.
//  - Nothing names, ranks or time-anchors a likely cause.
import { useState } from 'react';
import AlertRow from './AlertRow.jsx';
import DependencyMap from './DependencyMap.jsx';
import SeverityIcon, { SEVERITY_RANK } from '../ui/SeverityIcon.jsx';
import { staggerStep } from './stagger.js';

function worstSeverity(alerts) {
  return alerts.reduce((w, a) => (SEVERITY_RANK[a.severity] > SEVERITY_RANK[w] ? a.severity : w), 'info');
}

function buildGroups(incident) {
  const groups = incident.groups
    .map((g) => {
      const alerts = incident.alerts.filter((a) => a.group === g.id);
      const byService = {};
      for (const a of alerts) (byService[a.service] ??= []).push(a);
      const services = Object.entries(byService)
        .map(([service, list]) => ({
          service,
          alerts: [...list].sort((a, b) => a.time.localeCompare(b.time)),
          worst: worstSeverity(list),
        }))
        // By alert count (desc), ties by name. Deliberately NOT by time.
        .sort((a, b) => b.alerts.length - a.alerts.length || a.service.localeCompare(b.service));
      return { id: g.id, alerts, services };
    })
    .filter((g) => g.alerts.length > 0)
    .sort((a, b) => b.alerts.length - a.alerts.length);

  const [main, ...others] = groups; // the incident = the largest group
  return { main, others };
}

function ServiceRow({ row, open, onToggle, index }) {
  return (
    <li className={`svc-row stagger-item ${open ? 'open' : ''}`} style={{ '--i': index }}>
      <button className="svc-head" onClick={onToggle} aria-expanded={open}>
        <span className="chevron" aria-hidden="true">▸</span>
        <SeverityIcon severity={row.worst} />
        <span className="svc-name">{row.service}</span>
        <span className="count-chip">{`${row.alerts.length} alert${row.alerts.length === 1 ? '' : 's'}`}</span>
      </button>
      {open && (
        <ul className="alert-list nested">
          {row.alerts.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function GroupedView({ incident }) {
  const { main, others } = buildGroups(incident);
  const [expanded, setExpanded] = useState(() => new Set());
  const [selected, setSelected] = useState(null); // service highlighted on the map
  const [othersOpen, setOthersOpen] = useState(false);

  function toggle(service) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(service)) next.delete(service);
      else next.add(service);
      return next;
    });
    setSelected(service);
  }

  const counts = Object.fromEntries(main.services.map((r) => [r.service, r.alerts.length]));
  const worst = Object.fromEntries(main.services.map((r) => [r.service, r.worst]));
  const otherCount = others.reduce((n, g) => n + g.alerts.length, 0);

  return (
    <div className="grouped">
      <section className="panel">
        <header className="panel-head">
          <h2>Blast radius</h2>
          <span className="panel-meta">services in this incident are outlined · arrows show calls</span>
        </header>
        <DependencyMap services={incident.services} counts={counts} worst={worst} selected={selected} />
      </section>

      <div className="grouped-side">
        <section className="panel incident-card">
          <header className="panel-head">
            <h2>Incident</h2>
            <span className="panel-meta">
              {main.alerts.length} related alerts · {main.services.length} services
            </span>
          </header>
          <ul className="svc-list" style={{ '--step': staggerStep(main.services.length) }}>
            {main.services.map((row, i) => (
              <ServiceRow
                key={row.service}
                row={row}
                index={i}
                open={expanded.has(row.service)}
                onToggle={() => toggle(row.service)}
              />
            ))}
          </ul>
        </section>

        {others.length > 0 && (
          <section className="panel others">
            <button className="others-head" onClick={() => setOthersOpen((o) => !o)} aria-expanded={othersOpen}>
              <span className="chevron" aria-hidden="true">▸</span>
              <span>{`${others.length} other alert group${others.length === 1 ? '' : 's'} · ${otherCount} alerts`}</span>
            </button>
            {othersOpen &&
              others.map((g) => (
                <div key={g.id} className="other-group">
                  <div className="other-name">{g.services.map((s) => s.service).join(' + ')}</div>
                  <ul className="alert-list nested">
                    {[...g.alerts]
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((a) => (
                        <AlertRow key={a.id} alert={a} />
                      ))}
                  </ul>
                </div>
              ))}
          </section>
        )}
      </div>
    </div>
  );
}
