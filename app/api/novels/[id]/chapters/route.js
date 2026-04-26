import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId   = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    const pool = mysqlPool.promise();
    const [novel] = await pool.query('SELECT user_id FROM novels WHERE id = ?', [id]);
    const isOwner = userRole === 'admin' || (userId && parseInt(userId) === novel[0]?.user_id);
    const filter  = isOwner ? '' : "AND c.status = 'published'";
    const [rows]  = await pool.query(
      `SELECT * FROM chapters c WHERE c.novel_id = ? ${filter} ORDER BY chapter_number ASC`, [id]
    );
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { userId, userRole, title, content, status } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    const pool = mysqlPool.promise();
    const [novel] = await pool.query('SELECT user_id FROM novels WHERE id = ?', [id]);
    if (!novel.length) return NextResponse.json({ error: 'Novel not found' }, { status: 404 });
    if (userRole !== 'admin' && novel[0].user_id !== userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const [[{ maxNum }]] = await pool.query(
      'SELECT COALESCE(MAX(chapter_number), 0) AS maxNum FROM chapters WHERE novel_id = ?', [id]
    );
    const [result] = await pool.query(
      `INSERT INTO chapters (novel_id, chapter_number, title, content, status) VALUES (?, ?, ?, ?, ?)`,
      [id, maxNum + 1, title, content, status || 'published']
    );
    const [rows] = await pool.query('SELECT * FROM chapters WHERE id = ?', [result.insertId]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}