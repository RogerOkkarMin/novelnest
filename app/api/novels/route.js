import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function GET() {
  try {
    const pool = mysqlPool.promise();
    const [rows] = await pool.query(`
      SELECT
        n.id, n.user_id, n.title, n.description, n.coverimage,
        n.genres, n.status, n.views, n.created_at,
        u.username AS author_name,
        ROUND(AVG(r.rating), 1) AS avg_rating,
        COUNT(DISTINCT r.id)    AS review_count,
        COUNT(DISTINCT c.id)    AS chapter_count
      FROM novels n
      JOIN users u ON u.id = n.user_id
      LEFT JOIN reviews r ON r.novel_id = n.id
      LEFT JOIN chapters c ON c.novel_id = n.id AND c.status = 'published'
      WHERE n.status != 'draft'
      GROUP BY
        n.id, n.user_id, n.title, n.description, n.coverimage,
        n.genres, n.status, n.views, n.created_at, u.username
      HAVING COUNT(DISTINCT c.id) >= 1
      ORDER BY n.views DESC, n.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, title, description, coverimage, genres, status } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    const pool = mysqlPool.promise();
    const [result] = await pool.query(
      `INSERT INTO novels (user_id, title, description, coverimage, genres, status)
       VALUES (?,?,?,?,?,?)`,
      [userId, title, description, coverimage, genres, status || 'ongoing']
    );
    const [rows] = await pool.query('SELECT * FROM novels WHERE id=?', [result.insertId]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}