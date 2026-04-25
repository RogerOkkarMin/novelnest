'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const statusBadge = s => ({
  ongoing: 'badge-ongoing', completed: 'badge-completed',
  hiatus: 'badge-hiatus', draft: 'badge-draft',
}[s] || 'badge-genre');

export default function DashboardPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [novels,   setNovels]   = useState([]);
  const [expanded, setExpanded] = useState({}); // novelId -> bool, show chapters
  const [chapters, setChapters] = useState({}); // novelId -> chapter[]
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (user === null || user?.role === 'guest') { router.push('/novels'); return; }
    if (!user) return;
    fetch(`/api/novels/mine?userId=${user.id}&userRole=${user.role}`)
      .then(r => r.json())
      .then(d => { setNovels(Array.isArray(d) ? d : []); setLoading(false); });
  }, [user]);

  async function toggleChapters(novelId) {
    const isOpen = expanded[novelId];
    if (isOpen) {
      setExpanded(prev => ({ ...prev, [novelId]: false }));
      return;
    }
    // Fetch chapters if not already loaded
    if (!chapters[novelId]) {
      const q = `?userId=${user.id}&userRole=${user.role}`;
      const res = await fetch(`/api/novels/${novelId}/chapters${q}`);
      const data = await res.json();
      setChapters(prev => ({ ...prev, [novelId]: Array.isArray(data) ? data : [] }));
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
    setNovels(novels.filter(n => n.id !== id));
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
      n.id === novelId ? { ...n, chapter_count: (n.chapter_count || 1) - 1 } : n
    ));
  }

  if (!user || loading) return <div className="container"><p className="muted">Loading...</p></div>;

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            {user.role === 'admin' ? 'All Novels (Admin)' : 'My Novels'}
          </h1>
          <p className="muted" style={{ marginTop: 4 }}>
            {user.username} · {user.role}
          </p>
        </div>
        <Link href="/novels/new" className="btn btn-primary btn-sm">+ New Novel</Link>
      </div>

      {novels.length === 0 ? (
        <div className="dash-empty">
          <span style={{ fontSize: 40 }}>📝</span>
          <p>No novels yet.</p>
          <Link href="/novels/new" className="btn btn-primary btn-sm">Write your first novel</Link>
        </div>
      ) : novels.map(n => (
        <div key={n.id} className="dash-novel-card">
          {/* Novel row */}
          <div className="dash-novel-item">
            <div className="dash-novel-left">
              <img src={n.coverimage} alt={n.title} className="dash-novel-cover" />
              <div>
                <p className="dash-novel-title">{n.title}</p>
                <div className="dash-novel-meta">
                  <span className={`badge ${statusBadge(n.status)}`}>{n.status}</span>
                  <span>{n.chapter_count || 0} chapters</span>
                  <span>{n.views || 0} views</span>
                  {user.role === 'admin' && n.author_name && (
                    <span style={{ color: 'var(--text3)' }}>by {n.author_name}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="dash-novel-actions">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => toggleChapters(n.id)}
              >
                {expanded[n.id] ? 'Hide Chapters ▲' : 'Chapters ▼'}
              </button>
              <Link href={`/novels/${n.id}/edit`}    className="btn btn-outline btn-sm">Edit Cover</Link>
              <button onClick={() => deleteNovel(n.id)} className="btn btn-danger btn-sm">Delete</button>
            </div>
          </div>

          {/* Chapter panel */}
          {expanded[n.id] && (
            <div className="dash-chapter-panel">
              <div className="dash-chapter-panel-header">
                <p className="dash-chapter-panel-title">Chapters</p>
                <Link
                  href={`/novels/${n.id}/chapters/new`}
                  className="btn btn-primary btn-sm"
                >
                  + Add Chapter
                </Link>
              </div>

              {!chapters[n.id] || chapters[n.id].length === 0 ? (
                <p className="dash-chapter-empty">No chapters yet.</p>
              ) : (
                <div className="dash-chapter-list">
                  {chapters[n.id].map(ch => (
                    <div key={ch.id} className="dash-chapter-item">
                      <div className="dash-chapter-left">
                        <span className="chapter-num">Ch. {ch.chapter_number}</span>
                        <span className="dash-chapter-title">{ch.title}</span>
                        {ch.status === 'draft' && (
                          <span className="chapter-draft-tag">Draft</span>
                        )}
                        <span className="chapter-words">{(ch.word_count || 0).toLocaleString()} words</span>
                      </div>
                      <div className="dash-chapter-actions">
                        <Link
                          href={`/novels/${n.id}/chapters/${ch.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          Read
                        </Link>
                        <Link
                          href={`/novels/${n.id}/chapters/${ch.id}/edit`}
                          className="btn btn-outline btn-sm"
                        >
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