// One alert line. Shared by both variants so the only difference between
// A and B is how alerts are organised, not how an individual alert looks.
export default function AlertRow({ alert }) {
  return (
    <li className={`alert alert-${alert.severity}`}>
      <span className="alert-time">{alert.time}</span>
      <span className={`alert-sev sev-${alert.severity}`}>{alert.severity}</span>
      <span className="alert-service">{alert.service}</span>
      <span className="alert-msg">{alert.message}</span>
    </li>
  );
}
