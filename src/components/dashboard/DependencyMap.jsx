// Blast-radius map: a boxes-and-arrows service map drawn in SVG from incident.services.
// Dependencies flow top -> bottom: callers above, the things they call below.
//
// Services in the incident share ONE neutral "involved" style (outline + alert-count badge).
// No time labels or offsets: they would point straight at the answer.
//
// Readability:
//  - Hand-placed positions for this scenario (LAYOUT) so no edge crosses a box. Any service not
//    in LAYOUT falls back to the automatic depth-based layout.
//  - Curved edges, and each edge leaves / lands at its own point along the box edge, so several
//    arrows into one box stay individually visible instead of piling up.
//
// Interaction (variant B only, because only GroupedView renders this map):
//  - Involved services are buttons. Selecting one highlights every edge touching it (what it
//    calls and what calls it) and GroupedView opens + scrolls to that service's alerts.
//  - The highlight looks the same whichever service is selected, so it never hints at the answer.
import { useEffect, useState } from 'react';
import { staggerStep } from './stagger.js';

// Two sizes: the SVG scales to its container, so on phones we draw on a smaller canvas with
// narrower boxes. Otherwise the whole map shrinks and the labels become unreadable.
const SIZES = {
  wide: { W: 560, BOX_W: 118, FONT: 11.5 },
  compact: { W: 372, BOX_W: 88, FONT: 9.5 },
};
const ROW_H = 76;
const BOX_H = 34;
const TOP = 26;
const PAD = 10;
const COMPACT_QUERY = '(max-width: 640px)';

// x = fraction of the canvas width (clamped so the box and its badge stay inside), row = 0 at top.
// Checked against every edge in incident.json: no edge passes through a box at either size.
const LAYOUT = {
  'web-frontend': { x: 0.5, row: 0 },
  'api-gateway': { x: 0.5, row: 1 },
  cdn: { x: 0.82, row: 1 },
  'auth-svc': { x: 0.14, row: 2 },
  'orders-svc': { x: 0.42, row: 2 },
  'inventory-svc': { x: 0.7, row: 2 },
  'payments-svc': { x: 0.3, row: 3 },
  'db-replica': { x: 0.88, row: 3 },
  'redis-sessions': { x: 0.14, row: 4 },
  'db-primary': { x: 0.5, row: 4 },
};

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

// Fallback for services without a LAYOUT entry.
// level = 0 for a service with no dependencies, otherwise 1 + the deepest dependency's level.
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

function layout(services, W, BOX_W) {
  const minX = PAD + BOX_W / 2;
  const maxX = W - PAD - BOX_W / 2;
  const pos = {};

  const hand = services.every((s) => LAYOUT[s.id]);
  if (hand) {
    for (const s of services) {
      const { x, row } = LAYOUT[s.id];
      pos[s.id] = { x: Math.min(maxX, Math.max(minX, x * W)), y: TOP + row * ROW_H + BOX_H / 2 };
    }
  } else {
    const levels = computeLevels(services);
    const maxLevel = Math.max(...Object.values(levels));
    const rows = [];
    for (const s of services) (rows[maxLevel - levels[s.id]] ??= []).push(s.id);
    rows.forEach((ids, r) => {
      ids.forEach((id, i) => {
        pos[id] = { x: PAD + ((i + 0.5) * (W - 2 * PAD)) / ids.length, y: TOP + r * ROW_H + BOX_H / 2 };
      });
    });
  }

  const lastRow = Math.max(...Object.values(pos).map((p) => p.y));
  return { pos, height: lastRow + BOX_H / 2 + 16 };
}

// Orthogonal routing, like an architecture diagram: every edge leaves the bottom-centre of its
// box, drops into the gap just below that row, runs sideways to the target's column, then drops
// straight into the target's top-centre. Corners are rounded.
// Consequences (deliberate): edges from one box share a trunk and fan out like a tree, and
// edges into one box merge into a single arrow. LAYOUT keeps every target column free of boxes
// in the rows a vertical segment passes through.
const CORNER = 8;

function route(a, b) {
  const x1 = a.x;
  const y1 = a.y + BOX_H / 2;
  const x2 = b.x;
  const y2 = b.y - BOX_H / 2 - 1;
  const dx = x2 - x1;
  if (Math.abs(dx) < 1) return `M${x1},${y1} V${y2}`;

  const yc = y1 + (ROW_H - BOX_H) / 2; // middle of the gap below the source row
  const r = Math.min(CORNER, Math.abs(dx) / 2, (yc - y1) / 2);
  const dir = Math.sign(dx);
  return [
    `M${x1},${y1}`,
    `V${yc - r}`,
    `Q${x1},${yc} ${x1 + dir * r},${yc}`,
    `H${x2 - dir * r}`,
    `Q${x2},${yc} ${x2},${yc + r}`,
    `V${y2}`,
  ].join(' ');
}

function buildEdges(services, pos) {
  return services.flatMap((s) =>
    s.dependsOn.map((dep) => ({ from: s.id, to: dep, key: `${s.id}>${dep}`, d: route(pos[s.id], pos[dep]) }))
  );
}

export default function DependencyMap({ services, counts, worst, selected, onSelect }) {
  const { W, BOX_W, FONT } = SIZES[useCompact() ? 'compact' : 'wide'];
  const { pos, height } = layout(services, W, BOX_W);
  const edges = buildEdges(services, pos);
  const involved = (id) => Boolean(counts[id]);

  function edgeClass(e) {
    if (selected) {
      if (e.from === selected || e.to === selected) return 'focus';
      return 'dim';
    }
    return involved(e.from) && involved(e.to) ? 'hot' : '';
  }
  const marker = { focus: 'url(#arrow-focus)', hot: 'url(#arrow-hot)' };
  // Shared trunks overlap, so paint quiet edges first and highlighted ones on top.
  const layer = { dim: 0, '': 1, hot: 2, focus: 3 };
  const drawn = edges.map((e) => ({ ...e, cls: edgeClass(e) })).sort((p, q) => layer[p.cls] - layer[q.cls]);

  function onKey(e, id) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(id);
    }
  }

  return (
    <svg
      className={`depmap ${selected ? 'has-selection' : ''}`}
      viewBox={`0 0 ${W} ${height}`}
      aria-label="Service dependency map"
      style={{ '--node-font': `${FONT}px` }}
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 L3,5 z" className="depmap-arrowhead" />
        </marker>
        <marker id="arrow-hot" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 L3,5 z" className="depmap-arrowhead hot" />
        </marker>
        <marker id="arrow-focus" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 L3,5 z" className="depmap-arrowhead focus" />
        </marker>
      </defs>

      {drawn.map((e) => (
        <path key={e.key} d={e.d} className={`depmap-edge ${e.cls}`} markerEnd={marker[e.cls] ?? 'url(#arrow)'} />
      ))}

      <g style={{ '--step': staggerStep(services.length) }}>
        {services.map((s, i) => {
          const p = pos[s.id];
          const n = counts[s.id] ?? 0;
          const clickable = n > 0 && Boolean(onSelect);
          const cls = ['depmap-node', 'stagger-fade', n ? 'involved' : 'idle', selected === s.id ? 'selected' : '']
            .filter(Boolean)
            .join(' ');
          const interactive = clickable
            ? {
                role: 'button',
                tabIndex: 0,
                'aria-pressed': selected === s.id,
                'aria-label': `${s.label}, ${n} alert${n === 1 ? '' : 's'}`,
                onClick: () => onSelect(s.id),
                onKeyDown: (e) => onKey(e, s.id),
              }
            : {};
          return (
            <g key={s.id} className={cls} style={{ '--i': i }} {...interactive}>
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
