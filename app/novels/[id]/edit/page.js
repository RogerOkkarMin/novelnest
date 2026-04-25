'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const GENRES = ['Action','Romance','Drama','Fantasy','Horror','Mystery','Sci-Fi','Slice of Life'];

export default function EditNovelPage() {
  const { id } = useParams();
  const router  = useRouter();
  const { user } = useAuth();
  const [form,    setForm]    = useState({ title:'', description:'', coverimage:'', genres:[], status:'ongoing' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetch(`/api/novels/${id}`).then(r => r.json()).then(d => {
      if (!d.id) { router.push('/novels'); return; }
      setForm({ ...d, genres: d.genres ? d.genres.split(', ') : [] });
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!loading && user !== undefined) {
      const canEdit = user && (user.role === 'admin' || user.id === form.user_id);
      if (!canEdit) router.push(`/novels/${id}`);
    }
  }, [loading, user]);

  function toggleGenre(g) {
    setForm(f => ({ ...f, genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g] }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (form.genres.length === 0) { setError('Select at least one genre.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/novels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, genres: form.genres.join(', '), userId: user.id, userRole: user.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.push(`/novels/${id}`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="container-sm"><p className="muted">Loading...</p></div>;

  return (
    <div className="container-sm">
      <Link href={`/novels/${id}`} className="back-link">← Back</Link>
      <h1 className="page-title mb-lg">Edit Novel</h1>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="label">Cover Image URL</label>
          <input className="input" value={form.coverimage} onChange={e => setForm({ ...form, coverimage: e.target.value })} />
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
          <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {['draft','ongoing','completed','hiatus'].map(s => (
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
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}