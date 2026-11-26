// A simple boxes-and-arrows service map, drawn in SVG from incident.services.
// Layout: services that nothing else needs sit at the top, and the deepest
// dependencies (databases, caches) sit at the bottom.
// level = 0 for a service with no dependencies, otherwise 1 + the deepest dependency's level.

const W = 540;
const ROW_H = 74;
const BOX_W = 118;
const BOX_H = 34;

function computeLevels(services) {
  const byId = Object.fromEntries(services.map((s) => [s.id, s]));
  const memo = {};
  const level = (id) => {
    if (memo[id] !== undefined) return memo[id];
    const deps = byId[id]?.dependsOn ?? [];
    memo[id] = deps.length ? 1 + Math.max(...deps.map(level)) : 0;
    return memo[id];
  };
  services.forEach((s) => level(s.id));
  return memo;
}

function layout(services) {
  const levels = computeLevels(services);
  const maxLevel = Math.max(...Object.values(levels));
  const rows = [];
  for (const s of services) {
    const row = maxLevel - levels[s.id]; // highest level at the top
    (rows[row] ??= []).push(s.id);
  }
  const pos = {};
  rows.forEach((ids, r) => {
    ids.forEach((id, i) => {
      pos[id] = { x: ((i + 0.5) * W) / ids.length, y: 24 + r * ROW_H + BOX_H / 2 };
    });
  });
  return { pos, height: 24 + rows.length * ROW_H };
}

export default function DependencyMap({ services, counts }) {
  const { pos, height } = layout(services);

  return (
    <svg className="depmap" viewBox={`0 0 ${W} ${height}`} role="img" aria-label="Service dependency map">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="depmap-arrowhead" />
        </marker>
      </defs>

      {services.flatMap((s) =>
        s.dependsOn.map((dep) => {
          const a = pos[s.id];
          const b = pos[dep];
          const hot = counts[s.id] && counts[dep];
          return (
            <line
              key={`${s.id}-${dep}`}
              x1={a.x} y1={a.y + BOX_H / 2}
              x2={b.x} y2={b.y - BOX_H / 2 - 2}
              className={`depmap-edge ${hot ? 'hot' : ''}`}
              markerEnd="url(#arrow)"
            />
          );
        })
      )}

      {services.map((s) => {
        const p = pos[s.id];
        const n = counts[s.id] ?? 0;
        return (
          <g key={s.id} className={`depmap-node ${n ? 'alerting' : ''}`}>
            <rect x={p.x - BOX_W / 2} y={p.y - BOX_H / 2} width={BOX_W} height={BOX_H} rx="7" />
            <text x={p.x} y={p.y + 4} textAnchor="middle">{s.label}</text>
            {n > 0 && (
              <g>
                <circle cx={p.x + BOX_W / 2 - 4} cy={p.y - BOX_H / 2 + 2} r="10" className="depmap-badge" />
                <text x={p.x + BOX_W / 2 - 4} y={p.y - BOX_H / 2 + 6} textAnchor="middle" className="depmap-badge-text">{n}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
