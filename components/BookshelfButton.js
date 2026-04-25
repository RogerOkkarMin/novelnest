'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

const SHELVES = [
  { key: 'reading',      label: '📖 Currently Reading' },
  { key: 'want_to_read', label: '🔖 Want to Read'      },
  { key: 'favorites',    label: '⭐ Favorites'         },
];

const SHELF_LABELS = {
  reading:      'Reading',
  want_to_read: 'Want to Read',
  favorites:    'Favorite',
};

function getButtonLabel(shelves) {
  if (shelves.length === 0) return '＋ Add to Bookshelf';
  if (shelves.length === 1) return `📚 ${SHELF_LABELS[shelves[0]]}`;
  return `📚 ${shelves.length} Shelves`;
}

export default function BookshelfButton({ novelId }) {
  const { user } = useAuth();
  const [shelves,  setShelves]  = useState([]);
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const wrapRef = useRef(null);

  // Fetch current shelf status
  useEffect(() => {
    if (!user || user.role === 'guest') { setFetching(false); return; }
    fetch(`/api/bookshelf/status?userId=${user.id}&novelId=${novelId}`)
      .then(r => r.ok ? r.json() : { shelves: [] })
      .then(d => { setShelves(d.shelves || []); setFetching(false); })
      .catch(() => setFetching(false));
  }, [user, novelId]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  if (!user || user.role === 'guest') return null;

  async function toggle(shelf) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bookshelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, novelId, shelf }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setShelves(prev =>
        data.action === 'added'
          ? [...prev, shelf]
          : prev.filter(s => s !== shelf)
      );
    } catch (err) {
      console.error('Bookshelf toggle error:', err);
    } finally {
      setLoading(false);
    }
  }

  const hasAny = shelves.length > 0;

  return (
    <div className="bsb-wrap" ref={wrapRef}>
      <button
        className={`btn btn-sm ${hasAny ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => setOpen(o => !o)}
        disabled={loading || fetching}
      >
        {fetching ? '...' : loading ? 'Saving...' : getButtonLabel(shelves)}
      </button>

      {open && (
        <div className="bsb-dropdown">
          <p className="bsb-dropdown-title">Add to Bookshelf</p>
          {SHELVES.map(s => {
            const isActive = shelves.includes(s.key);
            return (
              <button
                key={s.key}
                className={`bsb-shelf-btn ${isActive ? 'active' : ''}`}
                onClick={() => toggle(s.key)}
                disabled={loading}
              >
                <span className="bsb-shelf-label">{s.label}</span>
                <span className={`bsb-shelf-check ${isActive ? 'visible' : ''}`}>✓</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}