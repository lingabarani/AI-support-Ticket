import { createContext, useContext, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

const roleMap = {
  support_agent: 'Support Agent',
  team_manager: 'Team Manager',
  business_executive: 'Business Executive',
  customer: 'Customer Portal User',
};

const makeLocalUser = ({ name, email, role }) => ({
  _id: `local-${Date.now()}`,
  name: name || email?.split('@')[0] || 'Local User',
  email,
  role: role || 'Customer Portal User',
  status: 'Active',
});

const displayRole = (role) => roleMap[role] || role;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  });

  const persistSession = (payload) => {
    const userPayload = { ...payload.user, role: displayRole(payload.user?.role) };
    localStorage.setItem('authToken', payload.token || 'local-demo-token');
    localStorage.setItem('authUser', JSON.stringify(userPayload));
    setUser(userPayload);
    return userPayload;
  };

  const login = async (email, password, portal = 'org') => {
    try {
      const payload = portal === 'customer'
        ? await authApi.customerLogin({ email, password })
        : await authApi.orgLogin({ email, password });
      return persistSession(payload);
    } catch {
      return persistSession({
        user: makeLocalUser({ email, role: portal === 'customer' ? 'Customer Portal User' : 'Support Agent' }),
      });
    }
  };

  const register = async (form, portal = 'org') => {
    try {
      const payload = portal === 'customer'
        ? await authApi.customerRegister(form)
        : await authApi.orgRegister(form);
      return persistSession(payload);
    } catch {
      return persistSession({
        user: makeLocalUser({ ...form, role: portal === 'customer' ? 'Customer Portal User' : roleMap[form.role] || 'Support Agent' }),
      });
    }
  };

  const selectRole = (roleKey) => {
    const selectedRole = roleMap[roleKey] || roleMap.support_agent;
    const updated = { ...user, role: selectedRole };
    localStorage.setItem('authUser', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  const demoLogin = (portal = 'org', roleKey = 'support_agent') => persistSession({
    user: makeLocalUser({
      name: portal === 'customer' ? 'Demo Customer' : roleMap[roleKey],
      email: portal === 'customer' ? 'customer.demo@example.com' : `${roleKey}@demo.example.com`,
      role: portal === 'customer' ? 'Customer Portal User' : roleMap[roleKey],
    }),
  });

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, selectRole, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
