import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId   = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    if (!userId) return NextResponse.json([]);

    const pool = mysqlPool.promise();
    const isAdmin = userRole === 'admin';

    const [rows] = await pool.query(`
      SELECT
        n.id, n.user_id, n.title, n.description, n.coverimage,
        n.genres, n.status, n.views, n.created_at,
        u.username AS author_name,
        COUNT(DISTINCT c.id) AS chapter_count
      FROM novels n
      JOIN users u ON u.id = n.user_id
      LEFT JOIN chapters c ON c.novel_id = n.id
      ${isAdmin ? '' : 'WHERE n.user_id = ?'}
      GROUP BY
        n.id, n.user_id, n.title, n.description, n.coverimage,
        n.genres, n.status, n.views, n.created_at, u.username
      ORDER BY n.created_at DESC
    `, isAdmin ? [] : [userId]);

    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}