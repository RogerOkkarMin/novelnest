import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function DELETE(req, { params }) {
  try {
    const { reviewId } = await params;
    const { userId, userRole } = await req.json();

    if (!userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const pool = mysqlPool.promise();
    const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [reviewId]);

    if (!rows.length)
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    // Only the review author or admin can delete
    if (userRole !== 'admin' && rows[0].user_id !== userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await pool.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Delete review error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}