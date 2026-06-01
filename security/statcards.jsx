/* global React, Icon, useCountUp */

/* ============================================================
   STAT CARDS
   ============================================================ */
function StatCard({ accent, accentVar, title, icon, children, className = '', style = {} }) {
  return (
    <div
      className={'stat-card glass-1 ' + className}
      style={{ '--accent': accent, ...style }}
    >
      <div className="stat-top-border" />
      <div className="stat-header">
        <span className="card-title">{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      {children}
    </div>
  );
}

function Sparkline({ values, color }) {
  const max = Math.max(1, ...values);
  return (
    <div className="sparkline">
      {values.map((v, i) => (
        <span
          key={i}
          className="spark-bar"
          style={{
            height: Math.max(6, (v / max) * 100) + '%',
            background: color,
            opacity: 0.35 + (i / values.length) * 0.65,
          }}
        />
      ))}
    </div>
  );
}

function StatCards({ reqPerSec, history, bans, threat, confidence, modelStatus }) {
  const animReq = useCountUp(reqPerSec, 450);
  const animBans = useCountUp(bans, 450);

  const threatMap = {
    NORMAL:   { color: 'var(--green)', glow: 'rgba(74,222,128,0.18)' },
    ELEVATED: { color: 'var(--amber)', glow: 'rgba(251,191,36,0.18)' },
    CRITICAL: { color: 'var(--red)',   glow: 'rgba(248,113,113,0.22)' },
  };
  const tInfo = threatMap[threat] || threatMap.NORMAL;
  const spark = history.slice(-10);

  return (
    <div className="stat-grid">
      {/* CARD 1 — REQUESTS / SEC */}
      <StatCard
        title="REQUESTS / SEC"
        accent="var(--indigo)"
        icon={<Icon.Activity size={18} color="var(--indigo-light)" />}
      >
        <div className="giant-stat stat-value" style={{ color: 'var(--text-primary)' }}>
          {animReq.toFixed(1)}
        </div>
        <div className="stat-unit">req/s</div>
        <div className="stat-sub">
          <Sparkline values={spark} color="var(--indigo-light)" />
          <span className="micro-label spark-label">LIVE</span>
        </div>
      </StatCard>

      {/* CARD 2 — ACTIVE BANS */}
      <StatCard
        title="ACTIVE BANS"
        accent="var(--red)"
        icon={<Icon.ShieldX size={18} color="var(--red)" />}
        className={bans > 0 ? 'pulse-red' : ''}
      >
        <div
          className={'giant-stat stat-value ' + (bans > 0 ? 'num-red-pulse' : '')}
          style={{ color: bans > 0 ? 'var(--red)' : 'var(--text-primary)' }}
        >
          {Math.round(animBans)}
        </div>
        <div className="stat-unit">blocked</div>
        <div className="stat-sub">
          <span className="micro-label" style={{ color: 'var(--text-secondary)' }}>
            {bans} {bans === 1 ? 'ADDRESS' : 'ADDRESSES'} BLOCKED
          </span>
        </div>
      </StatCard>

      {/* CARD 3 — THREAT LEVEL */}
      <StatCard
        title="THREAT LEVEL"
        accent={tInfo.color}
        icon={<Icon.Pulse size={18} color={tInfo.color} />}
        className={threat === 'CRITICAL' ? 'pulse-critical' : ''}
        style={{ boxShadow: undefined }}
      >
        <div
          className="threat-word mono"
          style={{ color: tInfo.color, textShadow: `0 0 30px ${tInfo.glow}` }}
        >
          {threat}
        </div>
        <div className="stat-sub">
          {threat === 'CRITICAL' ? (
            <span className="micro-label" style={{ color: tInfo.color }}>
              CONFIDENCE {confidence.toFixed(1)}%
            </span>
          ) : threat === 'ELEVATED' ? (
            <span className="micro-label" style={{ color: tInfo.color }}>
              TRAFFIC ABOVE BASELINE
            </span>
          ) : (
            <span className="micro-label" style={{ color: 'var(--text-secondary)' }}>
              ALL SYSTEMS NOMINAL
            </span>
          )}
        </div>
      </StatCard>

      {/* CARD 4 — MODEL STATUS */}
      <StatCard
        title="MODEL STATUS"
        accent="var(--cyan)"
        icon={<Icon.Chip size={18} color="var(--cyan)" />}
      >
        <div className="model-status">
          {modelStatus === 'READY' ? (
            <span className="model-word mono" style={{ color: 'var(--green)' }}>READY</span>
          ) : (
            <span className="model-word mono" style={{ color: 'var(--amber)' }}>
              <span className="spinner spinner-amber" /> TRAINING
            </span>
          )}
        </div>
        <div className="stat-sub">
          <span className="micro-label mono model-spec">CNN · 1D · SEQ:10</span>
        </div>
      </StatCard>
    </div>
  );
}

window.StatCards = StatCards;
