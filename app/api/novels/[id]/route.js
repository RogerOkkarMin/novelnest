import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const pool = mysqlPool.promise();
    const [rows] = await pool.query(`
      SELECT n.*, u.username AS author_name
      FROM novels n JOIN users u ON u.id = n.user_id
      WHERE n.id = ?
    `, [id]);
    if (!rows.length)
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    await pool.query('UPDATE novels SET views = views + 1 WHERE id = ?', [id]);
    return NextResponse.json(rows[0]);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { userId, userRole, title, description, coverimage, genres, status } = await req.json();
    const pool = mysqlPool.promise();
    const [rows] = await pool.query('SELECT user_id FROM novels WHERE id = ?', [id]);
    if (!rows.length)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (userRole !== 'admin' && rows[0].user_id !== userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await pool.query(
      `UPDATE novels SET title=?, description=?, coverimage=?, genres=?, status=? WHERE id=?`,
      [title, description, coverimage, genres, status, id]
    );
    const [updated] = await pool.query('SELECT * FROM novels WHERE id = ?', [id]);
    return NextResponse.json(updated[0]);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const { userId, userRole } = await req.json();
    const pool = mysqlPool.promise();
    const [rows] = await pool.query('SELECT user_id FROM novels WHERE id = ?', [id]);
    if (!rows.length)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (userRole !== 'admin' && rows[0].user_id !== userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await pool.query('DELETE FROM novels WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}