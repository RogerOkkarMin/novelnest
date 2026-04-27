'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function NewChapterPage() {
  const { id } = useParams();
  const router  = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const draftKey = `chapter_draft_${id}_new`;

  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) setForm(JSON.parse(saved));
  }, []);
  useEffect(() => { localStorage.setItem(draftKey, JSON.stringify(form)); }, [form]);
  useEffect(() => { if (user !== undefined && (!user || user.role === 'guest')) router.push('/novels'); }, [user]);

  async function submit(status) {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/novels/${id}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status, userId: user.id, userRole: user.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      localStorage.removeItem(draftKey);
      router.push(`/novels/${id}`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="container-md">
      <Link href={`/novels/${id}`} className="back-link">← Back to novel</Link>
      <h1 className="page-title mb-lg">Add Chapter</h1>
      <div className="form-group">
        <label className="label">Chapter Title</label>
        <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="form-group">
        <div className="word-count-row">
          <label className="label" style={{ margin: 0 }}>Content</label>
        </div>
        <textarea className="textarea textarea-lg" value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })} />
      </div>
      {error && <p className="error-text mb-md">{error}</p>}
      <div className="btn-group">
        <button disabled={saving} className="btn btn-ghost btn-full" onClick={() => submit('draft')}>Save Draft</button>
        <button disabled={saving} className="btn btn-primary btn-full" onClick={() => submit('published')}>
          {saving ? 'Publishing...' : 'Publish Chapter'}
        </button>
      </div>
    </div>
  );
}