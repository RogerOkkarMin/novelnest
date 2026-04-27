'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const GENRES = ['Action','Romance','Drama','Fantasy','Horror','Mystery','Sci-Fi','Slice of Life'];

const statusStyle = {
  ongoing:   { background: 'rgba(34,197,94,0.12)',  color: '#4ade80' },
  completed: { background: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
  hiatus:    { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  draft:     { background: 'rgba(100,100,100,0.2)', color: 'var(--text3)' },
};

const S = {
  page:      { maxWidth: 960, margin: '0 auto', padding: '36px 20px' },
  topbar:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  title:     { fontSize: 26, fontWeight: 700, color: 'var(--text)' },
  search:    { width: '100%', padding: '11px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', marginBottom: 16, outline: 'none' },
  pill:      { padding: '5px 14px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' },
  card:      { background: 'var(--bg2)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' },
  cardBody:  { padding: 14 },
  cardTitle: { fontSize: 15, fontWeight: 600, marginBottom: 4, lineHeight: 1.3, color: 'var(--text)' },
  cardAuthor:{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 },
  cardFooter:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardStats: { fontSize: 11, color: 'var(--text3)' },
  readLink:  { fontSize: 13, color: 'var(--accent)', fontWeight: 500 },
  badge:     { fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 500 },
  empty:     { color: 'var(--text3)', textAlign: 'center', padding: '48px 0', fontSize: 14 },
};

export default function NovelsPage() {
  const router = useRouter();
  const [novels,  setNovels]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [genre,   setGenre]   = useState('');

  useEffect(() => {
    fetch('/api/novels').then(r => r.json()).then(d => { setNovels(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const filtered = novels.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.author_name.toLowerCase().includes(search.toLowerCase());
    const matchGenre  = !genre || n.genres?.includes(genre);
    return matchSearch && matchGenre;
  });

  if (loading) return <div style={S.page}><p style={{ color: 'var(--text2)' }}>Loading...</p></div>;

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <h1 style={S.title}>Browse Novels</h1>
      </div>

      <input
        style={S.search}
        placeholder="Search by title or author..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="filter-pills">
        <button
          className={`filter-pill ${!genre ? 'active' : ''}`}
          style={S.pill}
          onClick={() => setGenre('')}
        >All</button>
        {GENRES.map(g => (
          <button
            key={g}
            className={`filter-pill ${genre === g ? 'active' : ''}`}
            style={S.pill}
            onClick={() => setGenre(g === genre ? '' : g)}
          >{g}</button>
        ))}
      </div>

      <div className="novel-grid">
        {filtered.map(n => (
          <div key={n.id} className="novel-card" style={S.card}>
            <div className="novel-card-cover-wrap" onClick={() => router.push(`/novels/${n.id}`)}>
              <img src={n.coverimage} alt={n.title} className="novel-card-img"
                style={{ width: '100%', height: 260, objectFit: 'cover' }} />
            </div>
            <div style={S.cardBody}>
              <div className="badges" style={{ marginBottom: 8 }}>
                {n.genres?.split(',').slice(0, 2).map(g => (
                  <span key={g} style={{ ...S.badge, background: 'rgba(139,92,246,0.15)', color: 'var(--accent)' }}>{g.trim()}</span>
                ))}
                {statusStyle[n.status] && <span style={{ ...S.badge, ...statusStyle[n.status] }}>{n.status}</span>}
              </div>
              <p style={S.cardTitle}>{n.title}</p>
              <p style={S.cardAuthor}>by {n.author_name}</p>
              <div style={S.cardFooter}>
                <span style={S.cardStats}>{n.chapter_count || 0} ch &bull; {n.avg_rating ? `★ ${n.avg_rating}` : 'No ratings'}</span>
                <Link href={`/novels/${n.id}`} className="read-link" style={S.readLink}>Read more</Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p style={S.empty}>No novels found.</p>}
    </div>
  );
}