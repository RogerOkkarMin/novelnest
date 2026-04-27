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

const S = {
  page:         { maxWidth: 960, margin: '0 auto', padding: '36px 20px' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap', gap: 12 },
  pageTitle:    { fontSize: 26, fontWeight: 700, color: 'var(--text)' },
  subtitle:     { fontSize: 14, color: 'var(--text2)', marginTop: 4 },
  loading:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 },
  loadingIcon:  { fontSize: 48 },
  muted:        { fontSize: 14, color: 'var(--text2)' },
  error:        { textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text2)', fontSize: 15 },
  section:      { marginBottom: 44 },
  titleRow:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  shelfTitle:   { fontSize: 17, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', margin: 0 },
  shelfIcon:    { fontSize: 18 },
  shelfCount:   { fontSize: 12, color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 10px', borderRadius: 20, border: '1px solid var(--border)' },
  emptyBox:     { padding: 28, border: '1px dashed var(--border)', borderRadius: 10, textAlign: 'center', background: 'var(--bg2)' },
  emptyText:    { color: 'var(--text3)', fontSize: 14, marginBottom: 10 },
  emptyLink:    { fontSize: 13, color: 'var(--accent)' },
  card:         { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', position: 'relative' },
  cardImg:      { width: '100%', height: 200, objectFit: 'cover' },
  cardBody:     { padding: '10px 12px' },
  cardTitle:    { fontSize: 13, fontWeight: 600, marginBottom: 3, lineHeight: 1.3, color: 'var(--text)' },
  cardAuthor:   { fontSize: 11, color: 'var(--text3)' },
  removeBtn:    {
    position: 'absolute', top: 6, right: 6,
    width: 26, height: 26, borderRadius: '50%',
    background: 'rgba(0,0,0,0.65)', border: 'none',
    color: '#fff', fontSize: 12, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s', zIndex: 2,
  },
};

export default function BookshelfPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [removing, setRemoving] = useState(null); // novelId + shelf being removed

  useEffect(() => {
    if (user === undefined) return;
    if (!user || user.role === 'guest') { router.push('/novels'); return; }
    fetch(`/api/bookshelf?userId=${user.id}`)
      .then(r => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json(); })
      .then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [user]);

  async function removeFromShelf(novelId, shelf) {
    const key = `${novelId}-${shelf}`;
    setRemoving(key);
    try {
      const res = await fetch('/api/bookshelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, novelId, shelf }),
      });
      if (!res.ok) throw new Error('Failed to remove');
      const data = await res.json();
      if (data.action === 'removed') {
        setItems(prev => prev.filter(i => !(i.novel_id === novelId && i.shelf === shelf)));
      }
    } catch (err) {
      console.error('Remove error:', err);
    } finally {
      setRemoving(null);
    }
  }

  async function removeAllFromShelf(novelId) {
    if (!confirm('Remove this novel from this shelf?')) return;
    const shelfItem = items.find(i => i.novel_id === novelId);
    if (!shelfItem) return;
    await removeFromShelf(novelId, shelfItem.shelf);
  }

  if (user === undefined || loading) {
    return (
      <div style={S.page}>
        <div style={S.loading}>
          <span style={S.loadingIcon}>📚</span>
          <p style={S.muted}>Loading your bookshelf...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={S.page}>
        <Link href="/novels" style={{ fontSize: 13, color: 'var(--accent)', display: 'inline-block', marginBottom: 20 }}>← Browse Novels</Link>
        <div style={S.error}>
          <span style={{ fontSize: 32 }}>⚠️</span>
          <p>Could not load your bookshelf.</p>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </div>
    );
  }

  const byShelf = shelf => items.filter(i => i.shelf === shelf);
  const total   = items.length;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>My Bookshelf</h1>
          <p style={S.subtitle}>
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
          <div key={s.key} style={S.section}>
            {/* Shelf header */}
            <div style={S.titleRow}>
              <h2 style={S.shelfTitle}>
                <span style={S.shelfIcon}>{s.icon}</span>
                {s.label}
              </h2>
              <span style={S.shelfCount}>{shelfItems.length}</span>
            </div>

            {/* Empty state */}
            {shelfItems.length === 0 ? (
              <div style={S.emptyBox}>
                <p style={S.emptyText}>{s.empty}</p>
                <Link href="/novels" style={S.emptyLink}>Browse novels →</Link>
              </div>
            ) : (
              <div className="shelf-grid">
                {shelfItems.map(item => {
                  const removeKey = `${item.novel_id}-${item.shelf}`;
                  const isRemoving = removing === removeKey;
                  return (
                    <div key={item.id} style={S.card} className="shelf-card">
                      {/* Remove button — top right corner */}
                      <button
                        style={{
                          ...S.removeBtn,
                          background: isRemoving ? 'rgba(239,68,68,0.8)' : 'rgba(0,0,0,0.65)',
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          if (!isRemoving) removeFromShelf(item.novel_id, item.shelf);
                        }}
                        title="Remove from this shelf"
                        disabled={isRemoving}
                      >
                        {isRemoving ? '…' : '✕'}
                      </button>

                      {/* Cover — click to go to novel */}
                      <img
                        src={item.coverimage}
                        alt={item.title}
                        style={S.cardImg}
                        onClick={() => router.push(`/novels/${item.novel_id}`)}
                      />
                      <div style={S.cardBody} onClick={() => router.push(`/novels/${item.novel_id}`)}>
                        <p style={S.cardTitle}>{item.title}</p>
                        <p style={S.cardAuthor}>by {item.author_name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}