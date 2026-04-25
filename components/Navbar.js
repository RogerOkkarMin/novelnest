'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MOCK_USERS } from '@/utils/mockUsers';

const ROLE_COLOR = {
  admin: { bg: 'rgba(239,68,68,0.18)',  color: '#f87171' },
  user:  { bg: 'rgba(139,92,246,0.18)', color: '#a78bfa' },
  guest: { bg: 'rgba(100,100,120,0.2)', color: '#9ca3af' },
};

export default function Navbar() {
  const { user, switchUser } = useAuth();
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);
  const isLoggedIn = user && user.role !== 'guest';

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        <Image src="/whitelogo.svg" alt="NovelNest" width={32} height={32} className="navbar-logo-img" />
        <span className="navbar-logo-text">NovelNest</span>
      </Link>

      <div className="navbar-links">
        <Link href="/novels"    className="nav-link">Browse</Link>
        {isLoggedIn && (
          <>
            <Link href="/bookshelf"  className="nav-link">Bookshelf</Link>
            <Link href="/dashboard"  className="nav-link">Dashboard</Link>
          </>
        )}

        <div className="user-dropdown-wrap" ref={dropRef}>
          <button
            className="user-dropdown-btn"
            onClick={() => setOpen(o => !o)}
            style={user ? ROLE_COLOR[user.role] : {}}
          >
            <span className="ud-avatar">{user?.username?.[0] ?? '?'}</span>
            <span className="ud-name">{user?.username ?? '...'}</span>
            <span className="ud-role">{user?.role}</span>
            <span className="ud-caret">{open ? '▲' : '▼'}</span>
          </button>

          {open && (
            <div className="user-dropdown-menu">
              <p className="ud-section-label">Switch Demo User</p>
              {MOCK_USERS.map(u => (
                <button
                  key={u.email}
                  className={`ud-item ${user?.email === u.email ? 'active' : ''}`}
                  onClick={() => { switchUser(u.email); setOpen(false); }}
                  style={user?.email === u.email ? ROLE_COLOR[u.role] : {}}
                >
                  <span className="ud-item-avatar">{u.username[0]}</span>
                  <div className="ud-item-info">
                    <span className="ud-item-name">{u.username}</span>
                    <span className="ud-item-email">{u.email}</span>
                  </div>
                  <span className="ud-item-role">{u.role}</span>
                  {user?.email === u.email && <span className="ud-item-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}