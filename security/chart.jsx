/* global React */
const { useState: useChartState, useRef: useChartRef } = React;

/* ============================================================
   TRAFFIC CHART — custom SVG area chart
   ============================================================ */
function TrafficChart({ data, attack, baseline }) {
  // data: array of { t: timestamp, v: value }
  const W = 760, H = 240;
  const padL = 8, padR = 8, padT = 16, padB = 26;
  const [hover, setHover] = useChartState(null);
  const wrapRef = useChartRef(null);

  const series = data.length ? data : [{ t: Date.now(), v: 0 }];
  const max = Math.max(60, ...series.map((d) => d.v)) * 1.15;
  const n = series.length;

  const x = (i) => padL + (i / Math.max(1, n - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - v / max) * (H - padT - padB);

  const linePts = series.map((d, i) => `${x(i)},${y(d.v)}`).join(' ');
  const areaPath =
    `M ${x(0)},${y(series[0].v)} ` +
    series.map((d, i) => `L ${x(i)},${y(d.v)}`).join(' ') +
    ` L ${x(n - 1)},${H - padB} L ${x(0)},${H - padB} Z`;

  const stroke = attack ? 'var(--red)' : 'var(--indigo-light)';
  const fillId = attack ? 'fillAttack' : 'fillNormal';

  const last = series[n - 1];
  const lastX = x(n - 1), lastY = y(last.v);

  // gridlines (horizontal)
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);

  // micro stats
  const recent = series.slice(-60);
  const avg = recent.reduce((s, d) => s + d.v, 0) / recent.length;
  const peak = Math.max(...series.map((d) => d.v));

  const onMove = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let idx = Math.round(((px - padL) / (W - padL - padR)) * (n - 1));
    idx = Math.max(0, Math.min(n - 1, idx));
    setHover(idx);
  };

  return (
    <div className="glass-1 chart-card">
      <div className="panel-header">
        <span className="card-title">LIVE TRAFFIC — REQ/SEC</span>
        <span className="badge badge-ghost">LAST 10 MIN</span>
      </div>

      <div className="chart-area" ref={wrapRef}
        onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="chart-svg">
          <defs>
            <linearGradient id="fillNormal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="fillAttack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid */}
          {gridVals.map((gv, i) => (
            <line key={i} x1={padL} x2={W - padR} y1={y(gv)} y2={y(gv)}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          <path d={areaPath} fill={`url(#${fillId})`} className="chart-fill" />
          <polyline points={linePts} fill="none" stroke={stroke} strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round" className="chart-line"
            vectorEffect="non-scaling-stroke" />

          {/* hover marker */}
          {hover != null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB}
                stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(series[hover].v)} r="3.5"
                fill="#fff" stroke={stroke} strokeWidth="2" />
            </g>
          )}

          {/* animated latest dot */}
          <circle cx={lastX} cy={lastY} r="8" fill={stroke} className="dot-pulse" />
          <circle cx={lastX} cy={lastY} r="4" fill={stroke} />
        </svg>

        {/* y-axis labels */}
        <div className="chart-yaxis mono">
          {[...gridVals].reverse().map((gv, i) => (
            <span key={i}>{Math.round(gv)}</span>
          ))}
        </div>

        {/* tooltip */}
        {hover != null && (
          <ChartTooltip
            x={(x(hover) / W) * 100}
            value={series[hover].v}
            ts={series[hover].t}
            color={stroke}
          />
        )}
      </div>

      <div className="chart-micro">
        <MicroStat label="AVG LAST 60S" value={avg.toFixed(1)} color="var(--indigo-light)" />
        <span className="micro-sep" />
        <MicroStat label="PEAK" value={Math.round(peak)} color="var(--cyan)" />
        <span className="micro-sep" />
        <MicroStat label="BASELINE" value={Math.round(baseline)} color="var(--text-secondary)" />
      </div>
    </div>
  );
}

function MicroStat({ label, value, color }) {
  return (
    <div className="micro-stat">
      <span className="micro-label">{label}</span>
      <span className="micro-value mono" style={{ color }}>{value}</span>
    </div>
  );
}

function ChartTooltip({ x, value, ts, color }) {
  const d = new Date(ts);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  const side = x > 65 ? 'right' : 'left';
  return (
    <div className={'chart-tooltip glass-2 tip-' + side} style={{ left: x + '%' }}>
      <div className="tip-value mono" style={{ color }}>{value.toFixed(1)} <span className="tip-unit">req/s</span></div>
      <div className="tip-time mono">{time}</div>
    </div>
  );
}

window.TrafficChart = TrafficChart;
