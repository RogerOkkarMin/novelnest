'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const SHELVES = [
  { key: 'reading',      label: 'Currently Reading', icon: '📖', empty: "You haven't started reading anything yet." },
  { key: 'want_to_read', label: 'Want to Read',       icon: '🔖', empty: 'Your reading wishlist is empty.'          },
  { key: 'favorites',    label: 'Favorites',          icon: '⭐', empty: "You haven't added any favorites yet."     },
];

export default function BookshelfPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (user === undefined) return;
    if (!user || user.role === 'guest') { router.push('/novels'); return; }

    fetch(`/api/bookshelf?userId=${user.id}`)
      .then(r => {
        if (!r.ok) throw new Error(`Server error: ${r.status}`);
        return r.json();
      })
      .then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [user]);

  if (user === undefined || loading) {
    return (
      <div className="container">
        <div className="bsb-page-loading">
          <span className="bsb-page-icon">📚</span>
          <p className="muted">Loading your bookshelf...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <Link href="/novels" className="back-link">← Browse Novels</Link>
        <div className="bsb-error">
          <span style={{ fontSize: 32 }}>⚠️</span>
          <p>Could not load your bookshelf.</p>
          <p className="muted" style={{ fontSize: 12 }}>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </div>
    );
  }

  const byShelf = shelf => items.filter(i => i.shelf === shelf);
  const total   = items.length;

  return (
    <div className="container">
      <div className="bsb-page-header">
        <div>
          <h1 className="page-title">My Bookshelf</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {total === 0
              ? 'Your bookshelf is empty — start adding novels!'
              : `${total} novel${total !== 1 ? 's' : ''} saved across all shelves`}
          </p>
        </div>
        <Link href="/novels" className="btn btn-outline btn-sm">Browse Novels</Link>
      </div>

      {SHELVES.map(s => {
        const shelfItems = byShelf(s.key);
        return (
          <div key={s.key} className="shelf-section">
            <div className="shelf-title-row">
              <h2 className="shelf-title">
                <span className="shelf-icon">{s.icon}</span>
                {s.label}
              </h2>
              <span className="shelf-count">{shelfItems.length}</span>
            </div>

            {shelfItems.length === 0 ? (
              <div className="shelf-empty-box">
                <p className="shelf-empty-text">{s.empty}</p>
                <Link href="/novels" className="shelf-empty-link">Browse novels →</Link>
              </div>
            ) : (
              <div className="shelf-grid">
                {shelfItems.map(item => (
                  <div
                    key={item.id}
                    className="shelf-card"
                    onClick={() => router.push(`/novels/${item.novel_id}`)}
                  >
                    <img src={item.coverimage} alt={item.title} className="shelf-card-img" />
                    <div className="shelf-card-body">
                      <p className="shelf-card-title">{item.title}</p>
                      <p className="shelf-card-author">by {item.author_name}</p>
                      {item.chapter_count > 0 && (
                        <p className="shelf-card-meta">{item.chapter_count} ch</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}