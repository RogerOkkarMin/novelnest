import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json([]);

    const pool = mysqlPool.promise();
    const [rows] = await pool.query(`
      SELECT
        b.id, b.user_id, b.novel_id, b.shelf, b.created_at,
        n.title, n.coverimage, n.genres, n.status, n.views,
        u.username AS author_name,
        COUNT(DISTINCT c.id)    AS chapter_count,
        ROUND(AVG(r.rating), 1) AS avg_rating
      FROM bookshelf b
      JOIN novels  n ON n.id = b.novel_id
      JOIN users   u ON u.id = n.user_id
      LEFT JOIN chapters c ON c.novel_id = n.id AND c.status = 'published'
      LEFT JOIN reviews  r ON r.novel_id = n.id
      WHERE b.user_id = ?
      GROUP BY
        b.id, b.user_id, b.novel_id, b.shelf, b.created_at,
        n.title, n.coverimage, n.genres, n.status, n.views, u.username
      ORDER BY b.created_at DESC
    `, [userId]);

    return NextResponse.json(rows);
  } catch (e) {
    console.error('Bookshelf GET error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, novelId, shelf } = body;

    if (!userId || !novelId || !shelf)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const pool = mysqlPool.promise();
    const [existing] = await pool.query(
      'SELECT id FROM bookshelf WHERE user_id=? AND novel_id=? AND shelf=?',
      [userId, novelId, shelf]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM bookshelf WHERE id=?', [existing[0].id]);
      return NextResponse.json({ action: 'removed', shelf });
    }

    await pool.query(
      'INSERT INTO bookshelf (user_id, novel_id, shelf) VALUES (?,?,?)',
      [userId, novelId, shelf]
    );
    return NextResponse.json({ action: 'added', shelf }, { status: 201 });
  } catch (e) {
    console.error('Bookshelf POST error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}