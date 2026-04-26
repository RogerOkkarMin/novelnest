import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function GET(req, { params }) {
  try {
    const { id, chId } = await params;
    const { searchParams } = new URL(req.url);
    const userId   = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    const pool = mysqlPool.promise();
    const [rows] = await pool.query(
      'SELECT * FROM chapters WHERE id = ? AND novel_id = ?', [chId, id]
    );
    if (!rows.length) return NextResponse.json({ message: 'Chapter not found' }, { status: 404 });
    const ch = rows[0];
    const [novel] = await pool.query('SELECT user_id FROM novels WHERE id = ?', [id]);
    const isOwner = userRole === 'admin' || (userId && parseInt(userId) === novel[0]?.user_id);
    if (ch.status === 'draft' && !isOwner)
      return NextResponse.json({ message: 'This chapter is not published yet.' }, { status: 403 });
    return NextResponse.json(ch);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id, chId } = await params;
    const { userId, userRole, title, content, status } = await req.json();
    const pool = mysqlPool.promise();
    const [novel] = await pool.query('SELECT user_id FROM novels WHERE id = ?', [id]);
    if (userRole !== 'admin' && novel[0]?.user_id !== userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await pool.query(
      'UPDATE chapters SET title=?, content=?, status=? WHERE id=?',
      [title, content, status, chId]
    );
    const [rows] = await pool.query('SELECT * FROM chapters WHERE id = ?', [chId]);
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id, chId } = await params;
    const { userId, userRole } = await req.json();
    const pool = mysqlPool.promise();
    const [novel] = await pool.query('SELECT user_id FROM novels WHERE id = ?', [id]);
    if (userRole !== 'admin' && novel[0]?.user_id !== userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await pool.query('DELETE FROM chapters WHERE id = ?', [chId]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}