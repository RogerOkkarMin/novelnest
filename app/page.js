'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const statusBadge = s => ({
  ongoing: 'badge-ongoing', completed: 'badge-completed',
  hiatus: 'badge-hiatus', draft: 'badge-draft'
}[s] || 'badge-genre');

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

  // Only top 3 for carousel
  const featured = novels.slice(0, 3);
  const recent   = novels.slice(0, 8);

  useEffect(() => {
    if (featured.length < 2) return;
    timerRef.current = setInterval(
      () => setCurrent(c => (c + 1) % featured.length), 4500
    );
    return () => clearInterval(timerRef.current);
  }, [featured.length]);

  function goTo(i) {
    clearInterval(timerRef.current);
    setCurrent(i);
    timerRef.current = setInterval(
      () => setCurrent(c => (c + 1) % featured.length), 4500
    );
  }

  return (
    <div className="container">

      {/* Carousel — top 3 only */}
      {!loading && featured.length > 0 && (
        <div className="carousel" style={{ marginTop: 24 }}>
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {featured.map(n => (
              <div
                key={n.id}
                className="carousel-slide"
                onClick={() => router.push(`/novels/${n.id}`)}
              >
                <img src={n.coverimage} alt={n.title} className="carousel-img" />
                <div className="carousel-overlay">
                  <span className="carousel-label">Featured Novel</span>
                  <h2 className="carousel-title">{n.title}</h2>
                  <p className="carousel-author">by {n.author_name}</p>
                  <Link
                    href={`/novels/${n.id}`}
                    className="btn btn-primary btn-sm carousel-btn"
                    onClick={e => e.stopPropagation()}
                  >
                    Read Now
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <button
            className="carousel-arrow left"
            onClick={() => goTo((current - 1 + featured.length) % featured.length)}
          >‹</button>
          <button
            className="carousel-arrow right"
            onClick={() => goTo((current + 1) % featured.length)}
          >›</button>

          <div className="carousel-dots">
            {featured.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === current ? 'active' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent novels grid */}
      {!loading && recent.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <div className="section-header">
            <h2 className="section-title">Recent Novels</h2>
            <Link href="/novels" className="view-all">View all →</Link>
          </div>
          <div className="novel-grid">
            {recent.map(n => (
              <div key={n.id} className="novel-card">
                <div
                  className="novel-card-cover-wrap"
                  onClick={() => router.push(`/novels/${n.id}`)}
                >
                  <img src={n.coverimage} alt={n.title} className="novel-card-img" />
                </div>
                <div className="novel-card-body">
                  <div className="badges">
                    {n.genres?.split(',').slice(0, 2).map(g => (
                      <span key={g} className="badge badge-genre">{g.trim()}</span>
                    ))}
                    <span className={`badge ${statusBadge(n.status)}`}>{n.status}</span>
                  </div>
                  <p className="novel-card-title">{n.title}</p>
                  <p className="novel-card-author">by {n.author_name}</p>
                  <div className="novel-card-footer">
                    <span className="novel-card-stats">
                      {n.chapter_count || 0} ch &bull;{' '}
                      {n.avg_rating ? `★ ${n.avg_rating}` : 'No ratings'}
                    </span>
                    <Link href={`/novels/${n.id}`} className="read-link">Read more</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && novels.length === 0 && (
        <p className="empty-text" style={{ paddingTop: 80 }}>
          No novels published yet. Be the first to write one!
        </p>
      )}
    </div>
  );
}