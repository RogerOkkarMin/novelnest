'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const statusColor = {
  ongoing:   { background: 'rgba(34,197,94,0.12)',  color: '#4ade80' },
  completed: { background: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
  hiatus:    { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
};

export default function HomePage() {
  const router = useRouter();
  const [novels,  setNovels]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/api/novels')
      .then(r => r.json())
      .then(d => { setNovels(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const featured = novels.slice(0, 3);
  const recent   = novels.slice(0, 8);

  function startTimer(len) {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % len), 4500);
  }

  useEffect(() => {
    if (featured.length < 2) return;
    startTimer(featured.length);
    return () => clearInterval(timerRef.current);
  }, [featured.length]);

  function goTo(i) {
    setCurrent(i);
    startTimer(featured.length);
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>

      {/* ── Carousel ── */}
      {!loading && featured.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          {/* Outer container clips overflow */}
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
            {/* Track — width = slides * 100%, slides side by side */}
            <div style={{
              display: 'flex',
              width: `${featured.length * 100}%`,
              transform: `translateX(-${(current * 100) / featured.length}%)`,
              transition: 'transform 0.5s ease',
            }}>
              {featured.map(n => (
                <div
                  key={n.id}
                  onClick={() => router.push(`/novels/${n.id}`)}
                  style={{
                    width: `${100 / featured.length}%`,
                    flexShrink: 0,
                    position: 'relative',
                    height: 420,
                    cursor: 'pointer',
                  }}
                >
                  <img
                    src={n.coverimage}
                    alt={n.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {/* Gradient overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 32,
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                      Featured Novel
                    </span>
                    <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>
                      {n.title}
                    </h2>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 16 }}>
                      by {n.author_name}
                    </p>
                    <Link
                      href={`/novels/${n.id}`}
                      onClick={e => e.stopPropagation()}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '8px 18px', borderRadius: 10,
                        background: 'var(--accent)', color: '#fff',
                        fontSize: 13, fontWeight: 500,
                      }}
                    >
                      Read Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Arrows */}
            {featured.length > 1 && <>
              <button
                onClick={() => goTo((current - 1 + featured.length) % featured.length)}
                style={{
                  position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)',
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff',
                  fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 2,
                }}
              >‹</button>
              <button
                onClick={() => goTo((current + 1) % featured.length)}
                style={{
                  position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)',
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff',
                  fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 2,
                }}
              >›</button>
            </>}

            {/* Dots */}
            <div style={{ position: 'absolute', bottom: 14, right: 18, display: 'flex', gap: 6 }}>
              {featured.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    width: 7, height: 7, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: i === current ? '#fff' : 'rgba(255,255,255,0.35)',
                    transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Novels ── */}
      {!loading && recent.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Recent Novels</h2>
            <Link href="/novels" style={{ fontSize: 13, color: 'var(--accent)' }}>View all →</Link>
          </div>
          <div className="novel-grid">
            {recent.map(n => (
              <div
                key={n.id}
                className="novel-card"
                style={{ background: 'var(--bg2)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}
              >
                <div className="novel-card-cover-wrap" onClick={() => router.push(`/novels/${n.id}`)}>
                  <img src={n.coverimage} alt={n.title} className="novel-card-img"
                    style={{ width: '100%', height: 260, objectFit: 'cover' }} />
                </div>
                <div style={{ padding: 14 }}>
                  <div className="badges" style={{ marginBottom: 8 }}>
                    {n.genres?.split(',').slice(0, 2).map(g => (
                      <span key={g} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 500, background: 'rgba(139,92,246,0.15)', color: 'var(--accent)' }}>
                        {g.trim()}
                      </span>
                    ))}
                    {statusColor[n.status] && (
                      <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 500, ...statusColor[n.status] }}>
                        {n.status}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, lineHeight: 1.3, color: 'var(--text)' }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>by {n.author_name}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {n.chapter_count || 0} ch &bull; {n.avg_rating ? `★ ${n.avg_rating}` : 'No ratings'}
                    </span>
                    <Link href={`/novels/${n.id}`} className="read-link" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
                      Read more
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && novels.length === 0 && (
        <p style={{ color: 'var(--text3)', textAlign: 'center', paddingTop: 80, fontSize: 14 }}>
          No novels published yet. Be the first to write one!
        </p>
      )}
    </div>
  );
}