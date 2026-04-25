import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId  = searchParams.get('userId');
    const novelId = searchParams.get('novelId');

    if (!userId || !novelId) return NextResponse.json({ shelves: [] });

    const pool = mysqlPool.promise();
    const [rows] = await pool.query(
      'SELECT shelf FROM bookshelf WHERE user_id=? AND novel_id=?',
      [userId, novelId]
    );
    return NextResponse.json({ shelves: rows.map(r => r.shelf) });
  } catch (e) {
    console.error('Bookshelf status error:', e.message);
    return NextResponse.json({ shelves: [] });
  }
}