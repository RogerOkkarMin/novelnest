'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const statusStyle = {
  ongoing:   { background: 'rgba(34,197,94,0.12)',  color: '#4ade80' },
  completed: { background: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
  hiatus:    { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  draft:     { background: 'rgba(100,100,100,0.2)', color: 'var(--text3)' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [novels,   setNovels]   = useState([]);
  const [expanded, setExpanded] = useState({});
  const [chapters, setChapters] = useState({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (user === null || user?.role === 'guest') { router.push('/novels'); return; }
    if (!user) return;
    fetch(`/api/novels/mine?userId=${user.id}&userRole=${user.role}`)
      .then(r => r.json())
      .then(d => { setNovels(Array.isArray(d) ? d : []); setLoading(false); });
  }, [user]);

  async function toggleChapters(novelId) {
    if (expanded[novelId]) {
      setExpanded(prev => ({ ...prev, [novelId]: false }));
      return;
    }
    if (!chapters[novelId]) {
      const q   = `?userId=${user.id}&userRole=${user.role}`;
      const res = await fetch(`/api/novels/${novelId}/chapters${q}`);
      const d   = await res.json();
      setChapters(prev => ({ ...prev, [novelId]: Array.isArray(d) ? d : [] }));
    }
    setExpanded(prev => ({ ...prev, [novelId]: true }));
  }

  async function deleteNovel(id) {
    if (!confirm('Delete this novel and all its chapters?')) return;
    await fetch(`/api/novels/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userRole: user.role }),
    });
    setNovels(prev => prev.filter(n => n.id !== id));
  }

  async function deleteChapter(novelId, chapterId) {
    if (!confirm('Delete this chapter?')) return;
    await fetch(`/api/novels/${novelId}/chapters/${chapterId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userRole: user.role }),
    });
    setChapters(prev => ({
      ...prev,
      [novelId]: prev[novelId].filter(c => c.id !== chapterId),
    }));
    setNovels(prev => prev.map(n =>
      n.id === novelId ? { ...n, chapter_count: Math.max((n.chapter_count || 1) - 1, 0) } : n
    ));
  }

  if (!user || loading) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 20px' }}>
        <p style={{ color: 'var(--text2)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            {user.role === 'admin' ? 'All Novels (Admin)' : 'My Novels'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>{user.username} · {user.role}</p>
        </div>
        <Link href="/novels/new" className="btn btn-primary btn-sm">+ New Novel</Link>
      </div>

      {/* Empty state */}
      {novels.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '60px 0', color: 'var(--text2)', fontSize: 15 }}>
          <span style={{ fontSize: 40 }}>📝</span>
          <p>No novels yet.</p>
          <Link href="/novels/new" className="btn btn-primary btn-sm">Write your first novel</Link>
        </div>
      )}

      {/* Novel list */}
      {novels.map(n => (
        <div key={n.id} style={{ marginBottom: 12, border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', background: 'var(--bg2)' }}>

          {/* Novel row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', flexWrap: 'wrap', gap: 12 }}>

            {/* Left — cover + info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
              <img
                src={n.coverimage}
                alt={n.title}
                style={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {n.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--text3)' }}>
                  {statusStyle[n.status] && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500, ...statusStyle[n.status] }}>
                      {n.status}
                    </span>
                  )}
                  <span>{n.chapter_count || 0} chapters</span>
                  <span>{n.views || 0} views</span>
                  {user.role === 'admin' && n.author_name && (
                    <span>by {n.author_name}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right — actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => toggleChapters(n.id)}
              >
                {expanded[n.id] ? 'Hide ▲' : 'Chapters ▼'}
              </button>
              <Link href={`/novels/${n.id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
              <button onClick={() => deleteNovel(n.id)} className="btn btn-danger btn-sm">Delete</button>
            </div>
          </div>

          {/* Chapter panel */}
          {expanded[n.id] && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px', background: 'var(--bg)' }}>

              {/* Panel header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Chapters
                </p>
                <Link href={`/novels/${n.id}/chapters/new`} className="btn btn-primary btn-sm">
                  + Add Chapter
                </Link>
              </div>

              {/* Chapter list */}
              {!chapters[n.id] || chapters[n.id].length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text3)', padding: '8px 0' }}>No chapters yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {chapters[n.id].map(ch => (
                    <div
                      key={ch.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', background: 'var(--bg2)',
                        border: '1px solid var(--border)', borderRadius: 10,
                        flexWrap: 'wrap', gap: 8,
                      }}
                    >
                      {/* Chapter info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 12, color: 'var(--text3)', minWidth: 36, flexShrink: 0 }}>
                          Ch. {ch.chapter_number}
                        </span>
                        <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ch.title}
                        </span>
                        {ch.status === 'draft' && (
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)', flexShrink: 0 }}>
                            Draft
                          </span>
                        )}
                      </div>

                      {/* Chapter actions */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <Link href={`/novels/${n.id}/chapters/${ch.id}`} className="btn btn-ghost btn-sm">
                          Read
                        </Link>
                        <Link href={`/novels/${n.id}/chapters/${ch.id}/edit`} className="btn btn-outline btn-sm">
                          Edit
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteChapter(n.id, ch.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}