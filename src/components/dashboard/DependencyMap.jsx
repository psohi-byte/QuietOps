// Blast-radius map: a boxes-and-arrows service map drawn in SVG from incident.services.
// Layout: services nothing else needs sit at the top, and the deepest dependencies
// (databases, caches) sit at the bottom.
// level = 0 for a service with no dependencies, otherwise 1 + the deepest dependency's level.
//
// Services in the incident share ONE neutral "involved" style (outline + alert-count badge).
// No time labels or offsets: they would point straight at the answer.
import { useEffect, useState } from 'react';
import { staggerStep } from './stagger.js';

// Two sizes: the SVG scales to its container, so on phones we draw on a smaller canvas with
// narrower boxes. Otherwise the whole map shrinks and the labels become unreadable.
const SIZES = {
  wide: { W: 540, BOX_W: 118, FONT: 11.5 },
  compact: { W: 372, BOX_W: 88, FONT: 9.5 },
};
const ROW_H = 76;
const BOX_H = 34;
const TOP = 26;
const PAD = 10;
const COMPACT_QUERY = '(max-width: 640px)';

function useCompact() {
  const [compact, setCompact] = useState(() => window.matchMedia?.(COMPACT_QUERY).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(COMPACT_QUERY);
    if (!mq) return;
    const onChange = () => setCompact(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return compact;
}

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

function layout(services, W) {
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
      // PAD keeps the count badges on the outermost boxes inside the canvas.
      pos[id] = { x: PAD + ((i + 0.5) * (W - 2 * PAD)) / ids.length, y: TOP + r * ROW_H + BOX_H / 2 };
    });
  });
  return { pos, height: TOP + rows.length * ROW_H - 10 };
}

export default function DependencyMap({ services, counts, worst, selected }) {
  const { W, BOX_W, FONT } = SIZES[useCompact() ? 'compact' : 'wide'];
  const { pos, height } = layout(services, W);
  const involved = (id) => Boolean(counts[id]);

  return (
    <svg
      className="depmap"
      viewBox={`0 0 ${W} ${height}`}
      role="img"
      aria-label="Service dependency map"
      style={{ '--node-font': `${FONT}px` }}
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="depmap-arrowhead" />
        </marker>
        <marker id="arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="depmap-arrowhead hot" />
        </marker>
      </defs>

      {services.flatMap((s) =>
        s.dependsOn.map((dep) => {
          const a = pos[s.id];
          const b = pos[dep];
          const hot = involved(s.id) && involved(dep);
          return (
            <line
              key={`${s.id}-${dep}`}
              x1={a.x} y1={a.y + BOX_H / 2}
              x2={b.x} y2={b.y - BOX_H / 2 - 2}
              className={`depmap-edge ${hot ? 'hot' : ''}`}
              markerEnd={hot ? 'url(#arrow-hot)' : 'url(#arrow)'}
            />
          );
        })
      )}

      <g style={{ '--step': staggerStep(services.length) }}>
        {services.map((s, i) => {
          const p = pos[s.id];
          const n = counts[s.id] ?? 0;
          const cls = ['depmap-node', 'stagger-fade', n ? 'involved' : 'idle', selected === s.id ? 'selected' : '']
            .filter(Boolean)
            .join(' ');
          return (
            <g key={s.id} className={cls} style={{ '--i': i }}>
              <rect x={p.x - BOX_W / 2} y={p.y - BOX_H / 2} width={BOX_W} height={BOX_H} rx="8" />
              <text x={p.x} y={p.y + 4} textAnchor="middle">{s.label}</text>
              {n > 0 && (
                <g className={`depmap-badge badge-${worst[s.id]}`}>
                  <circle cx={p.x + BOX_W / 2 - 3} cy={p.y - BOX_H / 2 + 1} r="9.5" />
                  <text x={p.x + BOX_W / 2 - 3} y={p.y - BOX_H / 2 + 5} textAnchor="middle">{n}</text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
