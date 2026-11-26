// Small inline-SVG severity icons, so a severity reads at a glance without a text pill.
// critical = filled octagon with "!", warning = triangle with "!", info = circle with "i".
export default function SeverityIcon({ severity, size = 16 }) {
  const common = { width: size, height: size, viewBox: '0 0 16 16', 'aria-hidden': true, className: `sev-icon sev-icon-${severity}` };

  if (severity === 'critical') {
    return (
      <svg {...common}>
        <path d="M5.2 1h5.6L15 5.2v5.6L10.8 15H5.2L1 10.8V5.2z" fill="currentColor" />
        <path d="M8 4.2v4.6" stroke="#0B0E14" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="8" cy="11.4" r="1.05" fill="#0B0E14" />
      </svg>
    );
  }
  if (severity === 'warning') {
    return (
      <svg {...common}>
        <path d="M8 1.4 15 14H1z" fill="currentColor" strokeLinejoin="round" />
        <path d="M8 6v3.8" stroke="#0B0E14" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="8" cy="11.9" r="0.95" fill="#0B0E14" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="M8 7.2v4.3" stroke="#0B0E14" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="8" cy="4.7" r="0.95" fill="#0B0E14" />
    </svg>
  );
}

export const SEVERITY_RANK = { critical: 3, warning: 2, info: 1 };
