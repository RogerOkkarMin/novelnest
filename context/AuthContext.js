'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { MOCK_USERS } from '@/utils/mockUsers';

const AuthContext = createContext(null);
const STORAGE_KEY = 'novelnest_mock_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = MOCK_USERS.find(u => u.email === saved);
      setUser(found || null);
    } else {
      setUser(null);
    }
  }, []);

  function switchUser(email) {
    const found = MOCK_USERS.find(u => u.email === email);
    if (found) {
      localStorage.setItem(STORAGE_KEY, found.email);
      setUser(found);
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, switchUser, logout, allUsers: MOCK_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}