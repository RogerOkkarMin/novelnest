'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const GENRES = ['Action','Romance','Drama','Fantasy','Horror','Mystery','Sci-Fi','Slice of Life'];
const statusBadge = s => ({ ongoing:'badge-ongoing', completed:'badge-completed', hiatus:'badge-hiatus', draft:'badge-draft' }[s] || 'badge-genre');

export default function NovelsPage() {
  const router = useRouter();
  const [novels, setNovels]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [genre,  setGenre]    = useState('');

  useEffect(() => {
    fetch('/api/novels').then(r => r.json()).then(d => { setNovels(d); setLoading(false); });
  }, []);

  const filtered = novels.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.author_name.toLowerCase().includes(search.toLowerCase());
    const matchGenre = !genre || n.genres?.includes(genre);
    return matchSearch && matchGenre;
  });

  if (loading) return <div className="container"><p className="muted">Loading...</p></div>;

  return (
    <div className="container">
      <div className="topbar">
        <h1 className="page-title">Browse Novels</h1>
        <Link href="/novels/new" className="btn btn-primary btn-sm">+ Publish</Link>
      </div>

      <input className="search-input" placeholder="Search by title or author..."
        value={search} onChange={e => setSearch(e.target.value)} />

      <div className="filter-pills">
        <button className={`filter-pill ${!genre ? 'active' : ''}`} onClick={() => setGenre('')}>All</button>
        {GENRES.map(g => (
          <button key={g} className={`filter-pill ${genre === g ? 'active' : ''}`}
            onClick={() => setGenre(g === genre ? '' : g)}>{g}</button>
        ))}
      </div>

      <div className="novel-grid">
        {filtered.map(n => (
          <div key={n.id} className="novel-card">
            <div className="novel-card-cover-wrap" onClick={() => router.push(`/novels/${n.id}`)}>
              <img src={n.coverimage} alt={n.title} className="novel-card-img" />
            </div>
            <div className="novel-card-body">
              <div className="badges">
                {n.genres?.split(',').slice(0,2).map(g => (
                  <span key={g} className="badge badge-genre">{g.trim()}</span>
                ))}
                <span className={`badge ${statusBadge(n.status)}`}>{n.status}</span>
              </div>
              <p className="novel-card-title">{n.title}</p>
              <p className="novel-card-author">by {n.author_name}</p>
              <div className="novel-card-footer">
                <span className="novel-card-stats">
                  {n.chapter_count || 0} ch &bull; {n.avg_rating ? `★ ${n.avg_rating}` : 'No ratings'}
                </span>
                <Link href={`/novels/${n.id}`} className="read-link">Read more</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="empty-text">No novels found.</p>}
    </div>
  );
}