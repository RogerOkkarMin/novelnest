'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const GENRES   = ['Action','Romance','Drama','Fantasy','Horror','Mystery','Sci-Fi','Slice of Life'];
const STATUSES = ['ongoing','completed','hiatus'];

export default function NewNovelPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [step,    setStep]    = useState(1);
  const [novelId, setNovelId] = useState(null);
  const [form,    setForm]    = useState({
    title: '', description: '', coverimage: '', genres: [], status: 'ongoing',
  });
  const [chapter, setChapter] = useState({ title: '', content: '' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const wordCount = chapter.content.trim() === '' ? 0
    : chapter.content.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (user !== undefined && (!user || user.role === 'guest')) router.push('/novels');
    const saved = localStorage.getItem('novel_draft');
    if (saved) { try { setForm(JSON.parse(saved)); } catch {} }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('novel_draft', JSON.stringify(form));
  }, [form]);

  function toggleGenre(g) {
    setForm(f => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g],
    }));
  }

  async function submitNovelInfo(e) {
    e.preventDefault();
    if (!form.title.trim())       { setError('Title is required.');            return; }
    if (!form.coverimage.trim())  { setError('Cover image URL is required.');  return; }
    if (form.genres.length === 0) { setError('Select at least one genre.');    return; }
    if (!form.description.trim()) { setError('Description is required.');      return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/novels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, genres: form.genres.join(', '), status: 'draft', userId: user.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create novel');
      setNovelId(data.id);
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function submitChapter(e) {
    e.preventDefault();
    if (!chapter.title.trim())   { setError('Chapter title is required.');   return; }
    if (!chapter.content.trim()) { setError('Chapter content is required.'); return; }
    setSaving(true); setError('');
    try {
      const chRes = await fetch(`/api/novels/${novelId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: chapter.title, content: chapter.content,
          status: 'published', userId: user.id, userRole: user.role,
        }),
      });
      if (!chRes.ok) {
        const d = await chRes.json();
        throw new Error(d.error || 'Failed to publish chapter');
      }
      await fetch(`/api/novels/${novelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, genres: form.genres.join(', '),
          status: form.status, userId: user.id, userRole: user.role,
        }),
      });
      localStorage.removeItem('novel_draft');
      router.push(`/novels/${novelId}`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  if (!user) return null;

  return (
    <div className="container-sm">
      <Link href="/dashboard" className="back-link">← My Novels</Link>

      <div className="step-indicator">
        <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
        <div className="step-line" />
        <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
      </div>

      {step === 1 && (
        <>
          <h1 className="page-title mb-lg">New Novel — Info</h1>
          <form onSubmit={submitNovelInfo}>
            <div className="form-group">
              <label className="label">Title</label>
              <input className="input" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Cover Image URL</label>
              <input className="input" placeholder="https://..."
                value={form.coverimage}
                onChange={e => setForm({ ...form, coverimage: e.target.value })} />
              {form.coverimage && (
                <img src={form.coverimage} alt="preview"
                  style={{ marginTop: 8, width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }} />
              )}
            </div>
            <div className="form-group">
              <label className="label">Genres</label>
              <div className="genre-grid">
                {GENRES.map(g => (
                  <label key={g} className={`genre-chip ${form.genres.includes(g) ? 'checked' : ''}`}>
                    <input type="checkbox" checked={form.genres.includes(g)} onChange={() => toggleGenre(g)} />
                    {g}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="select" value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="textarea" rows={4} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            {error && <p className="error-text mb-md">{error}</p>}
            <button type="submit" disabled={saving} className="btn btn-primary btn-full">
              {saving ? 'Saving...' : 'Next — Write Chapter 1 →'}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="page-title mb-lg">New Novel — Chapter 1</h1>
          <p className="muted mb-md">
            Your novel won't be visible publicly until you publish this chapter.
          </p>
          <form onSubmit={submitChapter}>
            <div className="form-group">
              <label className="label">Chapter Title</label>
              <input className="input" value={chapter.title}
                onChange={e => setChapter({ ...chapter, title: e.target.value })} />
            </div>
            <div className="form-group">
              <div className="word-count-row">
                <label className="label" style={{ margin: 0 }}>Content</label>
                <span className="chapter-words">{wordCount.toLocaleString()} words</span>
              </div>
              <textarea className="textarea textarea-lg" value={chapter.content}
                onChange={e => setChapter({ ...chapter, content: e.target.value })} />
            </div>
            {error && <p className="error-text mb-md">{error}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => { setError(''); setStep(1); }}>← Back</button>
              <button type="submit" disabled={saving} className="btn btn-primary btn-full">
                {saving ? 'Publishing...' : 'Publish Novel'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}