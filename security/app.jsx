/* global React, ReactDOM, Background, Login, Navbar, StatCards, TrafficChart, BansTable, AttackAlert, Icon */
const { useState: useS, useEffect: useE, useCallback } = React;

// The FastAPI backend serves this UI, so the API is same-origin — no CORS,
// and the WebSocket rides the same host. Falls back to :8000 if opened
// directly from the filesystem during development.
const SAME_ORIGIN = location.protocol === 'http:' || location.protocol === 'https:';
const API_BASE = SAME_ORIGIN ? '' : 'http://localhost:8000';
const WS_URL = SAME_ORIGIN
  ? (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws/dashboard'
  : 'ws://localhost:8000/ws/dashboard';

const MAX_POINTS = 90;

// JWT kept in memory only — never localStorage.
let authToken = null;

// Backend bans look like { ip, banned_at, reason }; the table wants
// { id, ip, ts, reason }.
function normalizeBan(b) {
  return {
    id: b.ip,
    ip: b.ip,
    ts: b.banned_at ? new Date(b.banned_at).getTime() : Date.now(),
    reason: b.reason || 'ml_detection',
  };
}

function App() {
  const [authed, setAuthed] = useS(false);
  const [username, setUsername] = useS('admin');

  const [data, setData] = useS([]);            // [{ t, v }]
  const [reqPerSec, setReqPerSec] = useS(0);
  const [bans, setBans] = useS([]);
  const [threat, setThreat] = useS('NORMAL');
  const [confidence, setConfidence] = useS(0);
  const [modelStatus, setModelStatus] = useS('READY');
  const [connected, setConnected] = useS(false);
  const [alert, setAlert] = useS(null);

  const authHeaders = useCallback(
    () => (authToken ? { Authorization: 'Bearer ' + authToken } : {}),
    []
  );

  // ── real login → JWT ──
  const doLogin = useCallback(async (user, pass) => {
    const res = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass }),
    });
    if (!res.ok) {
      let detail = 'Authentication rejected — credentials not recognized.';
      try { const d = await res.json(); if (d && d.detail) detail = d.detail; } catch (e) {}
      throw new Error(detail);
    }
    const d = await res.json();
    authToken = d.access_token || d.token || null;
    setUsername(user);
    setAuthed(true);
  }, []);

  const logout = useCallback(() => {
    authToken = null;
    setAuthed(false);
    setConnected(false);
  }, []);

  // ── polling: bans + model health ──
  const loadBans = useCallback(async () => {
    try {
      const res = await fetch(API_BASE + '/bans', { headers: authHeaders() });
      if (!res.ok) return;
      const d = await res.json();
      const list = Array.isArray(d) ? d : (d.bans || []);
      setBans(list.map(normalizeBan));
    } catch (e) { /* keep last good state */ }
  }, [authHeaders]);

  const loadHealth = useCallback(async () => {
    try {
      const res = await fetch(API_BASE + '/health', { headers: authHeaders() });
      if (!res.ok) return;
      const d = await res.json();
      setModelStatus(d.model_ready === false ? 'TRAINING' : 'READY');
    } catch (e) { /* keep last good state */ }
  }, [authHeaders]);

  useE(() => {
    if (!authed) return;
    loadBans();
    loadHealth();
    const b = setInterval(loadBans, 5000);
    const h = setInterval(loadHealth, 10000);
    return () => { clearInterval(b); clearInterval(h); };
  }, [authed, loadBans, loadHealth]);

  // ── WebSocket message → state ──
  const handleMessage = useCallback((msg) => {
    const now = Date.now();
    const rps =
      msg.rps != null ? msg.rps :
      msg.requests_per_sec != null ? msg.requests_per_sec : null;

    if (rps != null) {
      setReqPerSec(rps);
      setData((prev) => {
        const next = [...prev, { t: now, v: rps }];
        return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
      });
    }

    if (msg.is_attack) {
      const conf = msg.confidence != null
        ? (msg.confidence <= 1 ? msg.confidence * 100 : msg.confidence)
        : 0;
      setConfidence(conf);
      setThreat('CRITICAL');
      setAlert({
        confidence: conf,
        banned: (msg.ban_ips || []).length,
        limit: msg.rate_limit != null ? msg.rate_limit : '—',
      });
      loadBans(); // a ban was just written — refresh the table
    } else {
      setConfidence(0);
      if (msg.threat_level) setThreat(String(msg.threat_level).toUpperCase());
    }
  }, [loadBans]);

  // ── WebSocket connection (sends JWT as first frame, reconnects on drop) ──
  useE(() => {
    if (!authed) return;
    let ws, retry, alive = true;
    const connect = () => {
      try { ws = new WebSocket(WS_URL); } catch (e) { return; }
      ws.onopen = () => { setConnected(true); ws.send(authToken || ''); };
      ws.onmessage = (e) => {
        let msg; try { msg = JSON.parse(e.data); } catch (err) { return; }
        handleMessage(msg);
      };
      ws.onclose = () => {
        setConnected(false);
        if (alive) retry = setTimeout(connect, 2000);
      };
      ws.onerror = () => { try { ws.close(); } catch (e) {} };
    };
    connect();
    return () => {
      alive = false;
      clearTimeout(retry);
      try { if (ws) ws.close(); } catch (e) {}
    };
  }, [authed, handleMessage]);

  const unban = useCallback(async (ip) => {
    try {
      await fetch(API_BASE + '/bans/' + encodeURIComponent(ip), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      loadBans();
    } catch (e) { /* ignore */ }
  }, [authHeaders, loadBans]);

  if (!authed) {
    return (
      <React.Fragment>
        <Background />
        <Login onAuth={doLogin} />
      </React.Fragment>
    );
  }

  const baseline = data.length ? Math.min.apply(null, data.map((d) => d.v)) : 0;

  return (
    <React.Fragment>
      <Background />
      <div className="app-shell">
        <Navbar connected={connected} username={username} onSignOut={logout} />
        <main className="dashboard">
          <div className="section-stack">
            <StatCards
              reqPerSec={reqPerSec}
              history={data.map((d) => d.v)}
              bans={bans.length}
              threat={threat}
              confidence={confidence}
              modelStatus={modelStatus}
            />
            <div className="lower-grid">
              <TrafficChart data={data} attack={threat === 'CRITICAL'} baseline={baseline} />
              <BansTable bans={bans} onUnban={unban} onRefresh={loadBans} />
            </div>
          </div>
        </main>
      </div>

      {alert && <AttackAlert data={alert} onAck={() => setAlert(null)} />}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
