/* global React */
const { useMemo } = React;

/* ============================================================
   BACKGROUND — 4 layers + particle field
   ============================================================ */
function Background() {
  // Generate 30 standard particles + 3 special blurred indigo ones
  const particles = useMemo(() => {
    const arr = [];
    const sizePool = [1, 1, 2, 2, 2, 3];
    for (let i = 0; i < 30; i++) {
      const size = sizePool[Math.floor(Math.random() * sizePool.length)];
      const indigoTint = Math.random() < 0.35;
      const opacity = 0.1 + Math.random() * 0.3;
      arr.push({
        key: 'p' + i,
        size,
        left: Math.random() * 100,
        drift: (Math.random() * 80 - 40),
        duration: 20 + Math.random() * 40,
        delay: Math.random() * 30,
        color: indigoTint
          ? `rgba(129, 140, 248, ${opacity})`
          : `rgba(255, 255, 255, ${opacity})`,
        blur: 0,
      });
    }
    // 3 special: 8px, blurred, slow, deep indigo
    for (let i = 0; i < 3; i++) {
      arr.push({
        key: 'sp' + i,
        size: 8,
        left: Math.random() * 100,
        drift: (Math.random() * 60 - 30),
        duration: 50 + Math.random() * 25,
        delay: Math.random() * 30,
        color: 'rgba(99, 102, 241, 0.6)',
        blur: 2,
      });
    }
    return arr;
  }, []);

  return (
    <React.Fragment>
      <div className="bg-layer bg-base" />
      <div className="nebula nebula-a" />
      <div className="nebula nebula-b" />
      <div className="nebula nebula-c" />
      <div className="bg-layer grid-layer" />
      <div className="particle-field">
        {particles.map((p) => (
          <span
            key={p.key}
            className="particle"
            style={{
              left: p.left + '%',
              width: p.size + 'px',
              height: p.size + 'px',
              background: p.color,
              filter: p.blur ? `blur(${p.blur}px)` : 'none',
              animationDuration: p.duration + 's',
              animationDelay: '-' + p.delay + 's',
              '--drift': p.drift + 'px',
            }}
          />
        ))}
      </div>
      <div className="bg-layer scanlines" />
    </React.Fragment>
  );
}

window.Background = Background;
