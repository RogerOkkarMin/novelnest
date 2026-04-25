import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const pool = mysqlPool.promise();
    const [rows] = await pool.query(`
      SELECT r.*, u.username AS reviewer_name
      FROM reviews r JOIN users u ON u.id = r.user_id
      WHERE r.novel_id = ? ORDER BY r.created_at DESC
    `, [id]);
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { userId, rating, comment } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    const pool = mysqlPool.promise();
    const [result] = await pool.query(
      'INSERT INTO reviews (novel_id, user_id, rating, comment) VALUES (?,?,?,?)',
      [id, userId, rating, comment]
    );
    const [rows] = await pool.query(`
      SELECT r.*, u.username AS reviewer_name
      FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?
    `, [result.insertId]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}