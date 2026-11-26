// One alert line. Shared by both variants so the only difference between
// A and B is how alerts are organised, not how an individual alert looks.
// `index` drives the staggered entrance (see .stagger in styles.css).
import SeverityIcon from '../ui/SeverityIcon.jsx';

export default function AlertRow({ alert, index = 0 }) {
  return (
    <li className={`alert alert-${alert.severity} stagger-item`} style={{ '--i': index }}>
      <SeverityIcon severity={alert.severity} />
      <span className="alert-service">{alert.service}</span>
      <span className="alert-msg">{alert.message}</span>
      <time className="alert-time">{alert.time}</time>
    </li>
  );
}
