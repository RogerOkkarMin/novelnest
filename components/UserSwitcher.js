'use client';
import { useAuth } from '@/context/AuthContext';
import { MOCK_USERS } from '@/utils/mockUsers';

const ROLE_COLOR = {
  admin: { bg: 'rgba(239,68,68,0.18)',  color: '#f87171' },
  user:  { bg: 'rgba(139,92,246,0.18)', color: '#a78bfa' },
  guest: { bg: 'rgba(100,100,120,0.2)', color: '#9ca3af' },
};

export default function UserSwitcher() {
  const { user, switchUser } = useAuth();
  return (
    <div className="switcher-wrap">
      <span className="switcher-label">🎭 Demo:</span>
      <div className="switcher-pills">
        {MOCK_USERS.map(u => (
          <button
            key={u.email}
            onClick={() => switchUser(u.email)}
            className={`switcher-pill ${user?.email === u.email ? 'active' : ''}`}
            style={user?.email === u.email ? ROLE_COLOR[u.role] : {}}
            title={u.email}
          >
            <span className="pill-name">{u.username}</span>
            <span className="pill-role">{u.role}</span>
          </button>
        ))}
      </div>
    </div>
  );
}