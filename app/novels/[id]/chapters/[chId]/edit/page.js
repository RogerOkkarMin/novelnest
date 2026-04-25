'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function EditChapterPage() {
  const { id, chId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [form,    setForm]    = useState({ title: '', content: '', status: 'draft' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const draftKey = `chapter_draft_${id}_${chId}`;

  const wordCount = form.content.trim() === '' ? 0
    : form.content.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (user === undefined) return;
    const q = user ? `?userId=${user.id}&userRole=${user.role}` : '?userId=&userRole=';
    fetch(`/api/novels/${id}/chapters/${chId}${q}`).then(r => r.json()).then(d => {
      setForm({ title: d.title, content: d.content, status: d.status });
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (form.content) localStorage.setItem(draftKey, JSON.stringify(form));
  }, [form]);

  async function submit(status) {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/novels/${id}/chapters/${chId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status, userId: user.id, userRole: user.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      localStorage.removeItem(draftKey);
      router.push(`/novels/${id}/chapters/${chId}`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="container-md"><p className="muted">Loading...</p></div>;

  return (
    <div className="container-md">
      <Link href={`/novels/${id}/chapters/${chId}`} className="back-link">← Back to chapter</Link>
      <h1 className="page-title mb-lg">Edit Chapter</h1>
      <div className="form-group">
        <label className="label">Chapter Title</label>
        <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="form-group">
        <div className="word-count-row">
          <label className="label" style={{ margin: 0 }}>Content</label>
          <span className="chapter-words">{wordCount.toLocaleString()} words</span>
        </div>
        <textarea className="textarea textarea-lg" value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })} />
      </div>
      {error && <p className="error-text mb-md">{error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button disabled={saving} className="btn btn-ghost btn-full" onClick={() => submit('draft')}>Save Draft</button>
        <button disabled={saving} className="btn btn-primary btn-full" onClick={() => submit('published')}>
          {saving ? 'Saving...' : 'Publish'}
        </button>
      </div>
    </div>
  );
}