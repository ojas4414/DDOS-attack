/* global React, Icon */
const { useState: useAlertState, useEffect: useAlertEffect } = React;

/* ============================================================
   ATTACK ALERT OVERLAY
   ============================================================ */
function AttackAlert({ data, onAck }) {
  const DURATION = 10; // seconds
  const [remaining, setRemaining] = useAlertState(DURATION);

  useAlertEffect(() => {
    setRemaining(DURATION);
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, DURATION - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        onAck();
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="alert-backdrop" onClick={onAck}>
      <div className="glass-3 alert-card" onClick={(e) => e.stopPropagation()}>
        <div className="alert-top">
          <div className="alert-icon-ring">
            <span className="ring-dashed" />
            <Icon.Alert size={32} color="var(--red)" />
          </div>
          <div className="alert-title mono">THREAT DETECTED</div>
          <div className="alert-subtitle">Automated mitigation engaged</div>
        </div>

        <div className="alert-divider" />

        <div className="alert-stats">
          <AlertStat label="CONFIDENCE" value={data.confidence.toFixed(1) + '%'} color="var(--red)" />
          <AlertStat label="IPs BANNED" value={data.banned} color="var(--amber)" />
          <AlertStat label="RATE LIMIT" value={data.limit + ' r/s'} color="var(--indigo-light)" />
        </div>

        <div className="alert-actions">
          <button className="alert-ack" onClick={onAck}>ACKNOWLEDGE</button>
          <button className="alert-details" onClick={onAck}>VIEW DETAILS</button>
        </div>

        <div className="alert-progress-track">
          <div
            className="alert-progress-fill"
            style={{ transform: `scaleX(${remaining / DURATION})` }}
          />
        </div>
        <div className="alert-dismiss-text">
          Auto-dismissing in {Math.ceil(remaining)}s
        </div>
      </div>
    </div>
  );
}

function AlertStat({ label, value, color }) {
  return (
    <div className="glass-2 alert-stat">
      <span className="micro-label">{label}</span>
      <span className="alert-stat-val mono" style={{ color }}>{value}</span>
    </div>
  );
}

window.AttackAlert = AttackAlert;
