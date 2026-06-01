/* global React, Icon, relativeTime */
const { useState: useTblState } = React;

/* ============================================================
   ACTIVE BANS TABLE
   ============================================================ */
function BansTable({ bans, onUnban, onRefresh }) {
  const [tick, setTick] = useTblState(0);
  // re-render relative times every 15s
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-1 bans-card">
      <div className="panel-header">
        <span className="card-title">BLOCKED ADDRESSES</span>
        <div className="panel-header-right">
          <span className={'badge ' + (bans.length > 0 ? 'badge-red' : 'badge-indigo')}>
            {bans.length} ACTIVE
          </span>
          <button className="ghost-mini" onClick={onRefresh}>
            <Icon.Refresh size={12} color="currentColor" /> REFRESH
          </button>
        </div>
      </div>

      {bans.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="table-scroll">
          <table className="bans-table">
            <thead>
              <tr>
                <th>IP ADDRESS</th>
                <th>BLOCKED AT</th>
                <th>REASON</th>
                <th className="th-action">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {bans.map((b) => (
                <BanRow key={b.id} ban={b} onUnban={onUnban} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BanRow({ ban, onUnban }) {
  const [copied, setCopied] = useTblState(false);
  const [confirming, setConfirming] = useTblState(false);

  const copy = () => {
    navigator.clipboard?.writeText(ban.ip).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const clickUnban = () => {
    if (confirming) {
      onUnban(ban.id);
      return;
    }
    setConfirming(true);
    setTimeout(() => setConfirming(false), 3000);
  };

  const reasonClass = ban.reason === 'ml_detection' ? 'pill-indigo' : 'pill-amber';
  const reasonLabel = ban.reason === 'ml_detection' ? 'ml_detection' : 'manual';

  return (
    <tr className="ban-row" style={{ animation: 'rowSlideIn 220ms ease both' }}>
      <td className="cell-ip">
        <span className="ip-text mono">{ban.ip}</span>
        <button className="copy-btn" onClick={copy} title="Copy IP">
          {copied ? <Icon.Check size={12} color="var(--green)" /> : <Icon.Copy size={12} color="currentColor" />}
        </button>
      </td>
      <td className="cell-time" title={new Date(ban.ts).toLocaleString()}>
        {relativeTime(ban.ts)}
      </td>
      <td>
        <span className={'pill ' + reasonClass + ' mono'}>{reasonLabel}</span>
      </td>
      <td className="th-action">
        <button
          className={'unban-btn ' + (confirming ? 'unban-confirm' : '')}
          onClick={clickUnban}
        >
          {confirming ? 'CONFIRM?' : 'UNBAN'}
        </button>
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <Icon.Shield size={60} color="#1e293b" strokeWidth={1.3} />
      <div className="empty-title">NO THREATS DETECTED</div>
      <div className="empty-sub">System operating normally</div>
    </div>
  );
}

window.BansTable = BansTable;
