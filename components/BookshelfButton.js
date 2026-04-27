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

  useEffect(() => {
    if (!user || user.role === 'guest') { setFetching(false); return; }
    fetch(`/api/bookshelf/status?userId=${user.id}&novelId=${novelId}`)
      .then(r => r.ok ? r.json() : { shelves: [] })
      .then(d => { setShelves(d.shelves || []); setFetching(false); })
      .catch(() => setFetching(false));
  }, [user, novelId]);

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

  async function removeAll() {
    if (loading) return;
    if (!confirm('Remove this novel from all shelves?')) return;
    setLoading(true);
    try {
      // Remove from each shelf the novel is currently on
      for (const shelf of shelves) {
        await fetch('/api/bookshelf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, novelId, shelf }),
        });
      }
      setShelves([]);
      setOpen(false);
    } catch (err) {
      console.error('Remove all error:', err);
    } finally {
      setLoading(false);
    }
  }

  const hasAny = shelves.length > 0;

  const dropdownStyle = {
    position: 'absolute', top: 'calc(100% + 8px)', left: 0,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 14, padding: 8, zIndex: 30,
    minWidth: 220, boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
  };
  const titleStyle = {
    fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase',
    letterSpacing: 1, padding: '4px 12px 8px',
    borderBottom: '1px solid var(--border)', marginBottom: 6, display: 'block',
  };
  const shelfBtnStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', padding: '10px 12px', borderRadius: 8,
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 13, color: 'var(--text2)', gap: 8,
  };
  const removeBtnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    width: '100%', marginTop: 6, padding: '9px 12px', borderRadius: 8,
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
    color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 13, fontWeight: 500, transition: 'background 0.15s',
  };

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
        <div style={dropdownStyle}>
          <span style={titleStyle}>Add to Bookshelf</span>

          {SHELVES.map(s => {
            const isActive = shelves.includes(s.key);
            return (
              <button
                key={s.key}
                className={`bsb-shelf-btn ${isActive ? 'active' : ''}`}
                style={shelfBtnStyle}
                onClick={() => toggle(s.key)}
                disabled={loading}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>{s.label}</span>
                <span className={`bsb-shelf-check ${isActive ? 'visible' : ''}`}
                  style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>✓</span>
              </button>
            );
          })}

          {/* Remove from all shelves button — only shown when in at least one shelf */}
          {hasAny && (
            <>
              <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
              <button
                style={removeBtnStyle}
                onClick={removeAll}
                disabled={loading}
              >
                🗑 Remove from Bookshelf
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}