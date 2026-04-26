'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import BookshelfButton from '@/components/BookshelfButton';

const STARS = [1, 2, 3, 4, 5];
const statusBadge = s => ({ ongoing: 'badge-ongoing', completed: 'badge-completed', hiatus: 'badge-hiatus', draft: 'badge-draft' }[s] || 'badge-genre');

export default function NovelPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  const isLoggedIn = user && user.role !== 'guest';
  const canEdit = user && (user.role === 'admin' || user.id === novel?.user_id);

  useEffect(() => {
    if (user === undefined) return;
    const q = user ? `?userId=${user.id}&userRole=${user.role}` : '?userId=&userRole=';
    Promise.all([
      fetch(`/api/novels/${id}`).then(r => r.json()),
      fetch(`/api/novels/${id}/chapters${q}`).then(r => r.json()),
      fetch(`/api/novels/${id}/reviews`).then(r => r.json()),
    ]).then(([n, ch, rv]) => { setNovel(n); setChapters(ch); setReviews(rv); setLoading(false); });
  }, [id, user]);

  async function onDelete() {
    if (!confirm('Delete this novel and all its chapters?')) return;
    setDeleting(true);
    await fetch(`/api/novels/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userRole: user.role }),
    });
    router.push('/novels');
  }

  async function submitReview(e) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch(`/api/novels/${id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, ...reviewForm }),
    });
    const newReview = await res.json();
    setReviews([newReview, ...reviews]);
    setReviewForm({ rating: 5, comment: '' });
    setSubmitting(false);
  }

  if (loading) return <div className="container"><p className="muted">Loading...</p></div>;
  if (!novel?.id) return <div className="container"><p className="muted">Novel not found.</p></div>;

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="container">
      <Link href="/novels" className="back-link">← Browse</Link>

      <div className="novel-header">
        <img src={novel.coverimage} alt={novel.title} className="novel-cover" />
        <div className="novel-info">
          <h1 className="novel-title">{novel.title}</h1>
          <p className="novel-author">by {novel.author_name}</p>
          <div className="badges">
            {novel.genres?.split(',').map(g => (
              <span key={g} className="badge badge-genre">{g.trim()}</span>
            ))}
            <span className={`badge ${statusBadge(novel.status)}`}>{novel.status}</span>
          </div>
          <p className="novel-desc">{novel.description}</p>
          <p className="novel-stats">
            {avgRating ? `★ ${avgRating} (${reviews.length} reviews)` : 'No reviews yet'}
            &nbsp;&bull; {chapters.filter(c => c.status === 'published').length} chapters
            &nbsp;&bull; {novel.views} views
          </p>
          <div className="novel-actions">
            <BookshelfButton novelId={parseInt(id)} />
            {canEdit && (
              <>
                <Link href={`/novels/${id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                <button onClick={onDelete} disabled={deleting} className="btn btn-danger btn-sm">
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div className="chapter-list-header">
        <h2 className="section-title" style={{ margin: 0 }}>
          Chapters ({chapters.filter(c => c.status === 'published' || canEdit).length})
        </h2>
        {canEdit && (
          <Link href={`/novels/${id}/chapters/new`} className="btn btn-primary btn-sm">+ Add Chapter</Link>
        )}
      </div>

      {chapters.length === 0 ? (
        <p className="empty-text">No chapters yet.</p>
      ) : chapters.map(ch => (
        <div key={ch.id} className="chapter-item">
          <div className="chapter-item-left">
            <span className="chapter-num">Ch. {ch.chapter_number}</span>
            <Link href={`/novels/${id}/chapters/${ch.id}`} className="chapter-link">{ch.title}</Link>
            {ch.status === 'draft' && <span className="chapter-draft-tag">Draft</span>}
          </div>
        </div>
      ))}

      <hr className="divider" />

      <h2 className="section-title mb-md">Reviews ({reviews.length})</h2>

      {isLoggedIn ? (
        <div className="review-form">
          <p className="review-form-title">Leave a review</p>
          <form onSubmit={submitReview}>
            <div className="star-row">
              {STARS.map(s => (
                <button type="button" key={s} className="star-btn"
                  onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                  style={{ color: s <= reviewForm.rating ? 'var(--gold)' : 'var(--border)' }}>★</button>
              ))}
            </div>
            <textarea className="textarea mb-sm" placeholder="Write your thoughts... (optional)" rows={3}
              value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} />
            <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      ) : (
        <p className="login-to-review">Switch to a logged-in user above to leave a review.</p>
      )}

      {reviews.map(r => {
        const canDeleteReview = user && (user.role === 'admin' || user.id === r.user_id);

        async function handleDeleteReview() {
          if (!confirm('Delete your review?')) return;
          const res = await fetch(`/api/novels/${id}/reviews/${r.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, userRole: user.role }),
          });
          if (res.ok) setReviews(prev => prev.filter(x => x.id !== r.id));
        }

        return (
          <div key={r.id} className="review-item">
            <div className="review-item-header">
              <div className="review-item-left">
                <span className="reviewer-name">{r.reviewer_name}</span>
                <span className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </div>
              {canDeleteReview && (
                <button
                  className="review-delete-btn"
                  onClick={handleDeleteReview}
                  title="Delete review"
                >
                  ❌
                </button>
              )}
            </div>
            {r.comment && <p className="review-comment">{r.comment}</p>}
          </div>
        );
      })}
    </div>
  );
}