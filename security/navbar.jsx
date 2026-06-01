/* global React, Icon */
const { useState: useNavState, useEffect: useNavEffect } = React;

/* ============================================================
   NAVBAR
   ============================================================ */
function Navbar({ connected, username, onSignOut }) {
  const [clock, setClock] = useNavState(formatClock());
  useNavEffect(() => {
    const id = setInterval(() => setClock(formatClock()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-section nav-left">
        <span className="nav-logo-icon"><Icon.Shield size={20} color="#6366f1" strokeWidth={1.7} /></span>
        <span className="nav-brand mono">SENTINEL</span>
        <span className="nav-divider" />
        <span className="nav-tagline">THREAT INTELLIGENCE PLATFORM</span>
      </div>

      <div className="nav-section nav-center">
        <div className={'conn-pill ' + (connected ? 'conn-ok' : 'conn-lost')}>
          <span className="conn-dot" />
          <span className="conn-text">{connected ? 'SECURE LINK ESTABLISHED' : 'UPLINK LOST'}</span>
        </div>
      </div>

      <div className="nav-section nav-right">
        <span className="nav-clock mono">{clock}</span>
        <span className="nav-divider" />
        <span className="nav-session">
          <span className="micro-label session-label">SESSION</span>
          <span className="session-user">{username}</span>
        </span>
        <button className="signout-btn" onClick={onSignOut}>SIGN OUT</button>
      </div>
    </nav>
  );
}

function formatClock() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

window.Navbar = Navbar;
