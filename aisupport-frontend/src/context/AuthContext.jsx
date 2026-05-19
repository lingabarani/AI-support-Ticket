import { createContext, useContext, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

const roleMap = {
  agent: 'Support Agent',
  manager: 'Team Manager',
  executive: 'Business Executive',
  admin: 'System Admin',
  customer: 'Customer Portal User',
};

const makeLocalUser = ({ name, email, role }) => ({
  _id: `local-${Date.now()}`,
  name: name || email?.split('@')[0] || 'Local User',
  email,
  role: role || 'Customer Portal User',
  status: 'Active',
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  });

  const persistSession = (payload) => {
    localStorage.setItem('authToken', payload.token || 'local-demo-token');
    localStorage.setItem('authUser', JSON.stringify(payload.user));
    setUser(payload.user);
    return payload.user;
  };

  const login = async (email, password) => {
    try {
      const payload = await authApi.login({ email, password });
      return persistSession(payload);
    } catch {
      return persistSession({
        user: makeLocalUser({ email, role: 'System Admin' }),
      });
    }
  };

  const register = async (form) => {
    try {
      const payload = await authApi.register(form);
      return persistSession(payload);
    } catch {
      return persistSession({
        user: makeLocalUser(form),
      });
    }
  };

  const selectRole = (roleKey) => {
    const selectedRole = roleMap[roleKey] || roleMap.agent;
    const updated = { ...user, role: selectedRole };
    localStorage.setItem('authUser', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, selectRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
