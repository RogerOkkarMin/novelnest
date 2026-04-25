export const MOCK_USERS = [
  { id: 1, email: 'admin@test.com',  username: 'Admin',  role: 'admin' },
  { id: 2, email: 'roger@test.com',  username: 'Roger',  role: 'user'  },
  { id: 3, email: 'ryushi@test.com', username: 'Ryushi', role: 'user'  },
  { id: 4, email: 'guest@test.com',  username: 'Guest',  role: 'guest' },
];

export function getUserByEmail(email) {
  return MOCK_USERS.find(u => u.email === email) || null;
}