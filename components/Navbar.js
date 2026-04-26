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
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navRef = useRef(null);
  const isLoggedIn = user && user.role !== 'guest';

  // Detect mobile
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth <= 768); }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
        setUserOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  function close() {
    setMenuOpen(false);
    setUserOpen(false);
  }

  // ── Shared nav links ──
  const navLinks = (
    <>
      <Link href="/novels" onClick={close} style={isMobile ? mobileLink : desktopLink}>Browse</Link>
      {isLoggedIn && <>
        <Link href="/bookshelf" onClick={close} style={isMobile ? mobileLink : desktopLink}>Bookshelf</Link>
        <Link href="/dashboard" onClick={close} style={isMobile ? mobileLink : desktopLink}>Dashboard</Link>
      </>}
    </>
  );

  // ── User switcher dropdown ──
  const userDropdown = (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setUserOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: isMobile ? '10px 0' : '6px 12px',
          borderRadius: isMobile ? 0 : 20,
          border: isMobile ? 'none' : '1px solid var(--border)',
          borderBottom: isMobile ? '1px solid var(--border)' : undefined,
          background: 'transparent', cursor: 'pointer',
          fontFamily: 'inherit', width: isMobile ? '100%' : 'auto',
          ...(user ? ROLE_COLOR[user.role] : {}),
        }}
      >
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--accent)', color: '#fff',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {user?.username?.[0] ?? '?'}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
          {user?.username ?? '...'}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 2 }}>
          {user?.role}
        </span>
        <span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 'auto' }}>
          {userOpen ? '▲' : '▼'}
        </span>
      </button>

      {userOpen && (
        <div style={{
          position: isMobile ? 'static' : 'absolute',
          top: 'calc(100% + 8px)', right: 0,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 14, padding: 8,
          minWidth: isMobile ? '100%' : 240,
          zIndex: 100,
          boxShadow: isMobile ? 'none' : '0 12px 32px rgba(0,0,0,0.5)',
          marginTop: isMobile ? 4 : 0,
        }}>
          <p style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 8px 8px' }}>
            Switch Demo User
          </p>
          {MOCK_USERS.map(u => (
            <button
              key={u.email}
              onClick={() => { switchUser(u.email); close(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 10px', borderRadius: 8,
                background: user?.email === u.email ? 'var(--bg3)' : 'transparent',
                border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'left',
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--accent)', color: '#fff',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {u.username[0]}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', display: 'block' }}>{u.username}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', display: 'block' }}>{u.email}</span>
              </div>
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--bg)', color: 'var(--text3)' }}>
                {u.role}
              </span>
              {user?.email === u.email && (
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <nav
      ref={navRef}
      style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 50,
        width: '100%',
      }}
    >
      {/* ── Main bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 60,
      }}>
        {/* Logo */}
        <Link href="/" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <Image src="/whitelogo.svg" alt="NovelNest" width={30} height={30} style={{ borderRadius: 6 }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>NovelNest</span>
        </Link>

        {/* Desktop: links + user dropdown inline */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {navLinks}
            {userDropdown}
          </div>
        )}

        {/* Mobile: hamburger only */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'flex', flexDirection: 'column',
              gap: 5, background: 'none', border: 'none',
              cursor: 'pointer', padding: 8, borderRadius: 8,
            }}
            aria-label="Menu"
          >
            <span className={`hamburger-bar ${menuOpen ? 'open' : ''}`} />
            <span className={`hamburger-bar ${menuOpen ? 'open' : ''}`} />
            <span className={`hamburger-bar ${menuOpen ? 'open' : ''}`} />
          </button>
        )}
      </div>

      {/* ── Mobile dropdown menu ── */}
      {isMobile && menuOpen && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '4px 24px 16px',
          background: 'var(--bg2)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {navLinks}
          {userDropdown}
        </div>
      )}
    </nav>
  );
}

const desktopLink = {
  fontSize: 14,
  color: 'var(--text2)',
};

const mobileLink = {
  fontSize: 15,
  color: 'var(--text)',
  padding: '12px 0',
  borderBottom: '1px solid var(--border)',
  display: 'block',
  width: '100%',
};