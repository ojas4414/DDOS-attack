/* global React */
/* ============================================================
   ICONS — minimal stroke SVGs (no decorative illustration)
   ============================================================ */
const Icon = {
  Shield: ({ size = 20, color = 'currentColor', strokeWidth = 1.6, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 2.5 4.5 6v5.5c0 4.5 3.1 8.1 7.5 9.5 4.4-1.4 7.5-5 7.5-9.5V6L12 2.5Z"
        stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  ),
  Hexagon: ({ size = 20, color = 'currentColor', strokeWidth = 1.6, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Z"
        stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M12 7.5 16 10v4l-4 2.5L8 14v-4l4-2.5Z"
        stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" opacity="0.55" />
    </svg>
  ),
  Activity: ({ size = 18, color = 'currentColor', strokeWidth = 1.8, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M2 12h3.5l2.5-7 4 16 2.8-9 1.7 4H22"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ShieldX: ({ size = 18, color = 'currentColor', strokeWidth = 1.6, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 2.5 4.5 6v5.5c0 4.5 3.1 8.1 7.5 9.5 4.4-1.4 7.5-5 7.5-9.5V6L12 2.5Z"
        stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="m9.5 9.5 5 5m0-5-5 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  ),
  Chip: ({ size = 18, color = 'currentColor', strokeWidth = 1.6, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" stroke={color} strokeWidth={strokeWidth} />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke={color} strokeWidth={strokeWidth} opacity="0.6" />
      <path d="M9.5 6.5V3.5M14.5 6.5V3.5M9.5 20.5v-3M14.5 20.5v-3M6.5 9.5h-3M6.5 14.5h-3M20.5 9.5h-3M20.5 14.5h-3"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  ),
  Pulse: ({ size = 18, color = 'currentColor', strokeWidth = 1.8, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M2 12h4l2-4 4 8 2-4h8" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Alert: ({ size = 32, color = 'currentColor', strokeWidth = 1.8, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 3 1.8 21h20.4L12 3Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M12 10v5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="12" cy="17.8" r="0.9" fill={color} />
    </svg>
  ),
  Copy: ({ size = 13, color = 'currentColor', strokeWidth = 1.6, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="9" y="9" width="11" height="11" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke={color} strokeWidth={strokeWidth} />
    </svg>
  ),
  Check: ({ size = 13, color = 'currentColor', strokeWidth = 2, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="m4 12 5 5 11-11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Refresh: ({ size = 13, color = 'currentColor', strokeWidth = 1.7, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M20 11a8 8 0 1 0-1.6 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M20 5v6h-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Close: ({ size = 14, color = 'currentColor', strokeWidth = 2, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="m6 6 12 12M18 6 6 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  ),
};

/* Count-up hook: animates a number toward `target` over `ms`. */
function useCountUp(target, ms = 450) {
  const [val, setVal] = React.useState(target);
  const ref = React.useRef({ from: target, start: 0, raf: 0 });
  React.useEffect(() => {
    const state = ref.current;
    state.from = val;
    state.start = performance.now();
    cancelAnimationFrame(state.raf);
    const tick = (now) => {
      const t = Math.min(1, (now - state.start) / ms);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setVal(state.from + (target - state.from) * eased);
      if (t < 1) state.raf = requestAnimationFrame(tick);
    };
    state.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(state.raf);
    // eslint-disable-next-line
  }, [target]);
  return val;
}

function relativeTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + ' min ago';
  const h = Math.floor(m / 60);
  return h + 'h ago';
}

Object.assign(window, { Icon, useCountUp, relativeTime });
