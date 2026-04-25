'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ChapterPage() {
  const { id, chId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [chapter,     setChapter]     = useState(null);
  const [allChapters, setAllChapters] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user === undefined) return;
    const q = user ? `?userId=${user.id}&userRole=${user.role}` : '?userId=&userRole=';
    Promise.all([
      fetch(`/api/novels/${id}/chapters/${chId}${q}`).then(r => r.json()),
      fetch(`/api/novels/${id}/chapters${q}`).then(r => r.json()),
    ]).then(([ch, all]) => {
      if (ch.message) { setError(ch.message); setLoading(false); return; }
      setChapter(ch); setAllChapters(all); setLoading(false);
    });
  }, [id, chId, user]);

  async function doDelete() {
    if (!confirm('Delete this chapter?')) return;
    setDeleting(true);
    await fetch(`/api/novels/${id}/chapters/${chId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userRole: user.role }),
    });
    router.push(`/novels/${id}`);
  }

  if (loading) return <div className="container-md"><p className="muted">Loading...</p></div>;
  if (error)   return (
    <div className="container-md">
      <Link href={`/novels/${id}`} className="back-link">← Back to novel</Link>
      <p className="muted" style={{ marginTop: 20 }}>{error}</p>
    </div>
  );

  const canEdit = user && (user.role === 'admin' || user.id === chapter?.user_id);
  const idx  = allChapters.findIndex(c => c.id === parseInt(chId));
  const prev = allChapters[idx - 1];
  const next = allChapters[idx + 1];

  return (
    <div className="container-md">
      <Link href={`/novels/${id}`} className="back-link">← Back to novel</Link>

      <div className="chapter-header">
        <p className="chapter-num-label">Chapter {chapter.chapter_number}</p>
        <h1 className="chapter-title-lg">{chapter.title}</h1>
        <p className="chapter-meta">{chapter.word_count.toLocaleString()} words</p>
      </div>

      <div className="chapter-content">{chapter.content}</div>

      <div className="chapter-nav">
        {prev
          ? <Link href={`/novels/${id}/chapters/${prev.id}`} className="chapter-nav-link">← Ch.{prev.chapter_number}: {prev.title}</Link>
          : <span />}
        {next
          ? <Link href={`/novels/${id}/chapters/${next.id}`} className="chapter-nav-link">Ch.{next.chapter_number}: {next.title} →</Link>
          : <span />}
      </div>

      {canEdit && (
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Link href={`/novels/${id}/chapters/${chId}/edit`} className="btn btn-outline btn-sm">Edit Chapter</Link>
          <button onClick={doDelete} disabled={deleting} className="btn btn-danger btn-sm">
            {deleting ? 'Deleting...' : 'Delete Chapter'}
          </button>
        </div>
      )}
    </div>
  );
}