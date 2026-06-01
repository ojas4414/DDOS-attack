/* global React, Icon */
const { useState } = React;

/* ============================================================
   LOGIN PAGE
   ============================================================ */
function Login({ onAuth }) {
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!pass.trim()) {
      setError('Credentials required to establish secure link.');
      return;
    }
    setLoading(true);
    try {
      // Real backend auth — onAuth performs POST /auth/login and throws on failure.
      await onAuth(user.trim() || 'admin', pass);
      // success unmounts this component; no need to clear loading
    } catch (err) {
      setError((err && err.message) || 'Authentication rejected — credentials not recognized.');
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="glass-3 login-card" onSubmit={submit}>
        <div className="login-logo">
          <div className="login-badge">
            <Icon.Shield size={28} color="#fff" strokeWidth={1.5} />
          </div>
          <div className="login-title mono">SENTINEL</div>
          <div className="login-sub">SECURITY OPERATIONS CENTER</div>
        </div>

        <div className="login-divider" />

        {error && (
          <div className="error-banner" role="alert">
            <span className="error-x"><Icon.Close size={10} color="#f87171" strokeWidth={2.4} /></span>
            <span>{error}</span>
          </div>
        )}

        <div className="field">
          <label className="field-label" htmlFor="op">OPERATOR ID</label>
          <input id="op" className="field-input" value={user}
            autoComplete="username"
            onChange={(e) => setUser(e.target.value)} />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="pw">ACCESS KEY</label>
          <input id="pw" type="password" className="field-input mono" value={pass}
            placeholder="••••••••••••"
            autoComplete="current-password"
            onChange={(e) => setPass(e.target.value)} />
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <span className="spinner" /> : 'AUTHENTICATE'}
        </button>

        <div className="login-foot">SENTINEL v1.0 · CLASSIFIED</div>
      </form>
    </div>
  );
}

window.Login = Login;
