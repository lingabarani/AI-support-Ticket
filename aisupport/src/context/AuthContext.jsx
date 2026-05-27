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
const isCustomerRole = (role) => displayRole(role) === 'Customer Portal User';
const isOrgRole = (role) => ['Support Agent', 'Team Manager', 'Business Executive'].includes(displayRole(role));

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  });

  const persistSession = (payload, remember = true) => {
    const userPayload = { ...payload.user, role: displayRole(payload.user?.role) };
    const targetStorage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem('authToken');
    otherStorage.removeItem('authUser');
    targetStorage.setItem('authToken', payload.token || 'local-demo-token');
    targetStorage.setItem('authUser', JSON.stringify(userPayload));
    setUser(userPayload);
    return userPayload;
  };

  const login = async (email, password, portal = 'org', remember = true) => {
    const payload = portal === 'customer'
      ? await authApi.customerLogin({ email, password })
      : await authApi.orgLogin({ email, password });
    const returnedRole = displayRole(payload.user?.role);
    if (portal === 'org' && !isOrgRole(returnedRole)) {
      throw new Error('This account belongs to the customer portal. Use an organization account to continue.');
    }
    if (portal === 'customer' && !isCustomerRole(returnedRole)) {
      throw new Error('This account belongs to the organization portal. Use the organization login.');
    }
    return persistSession(payload, remember);
  };

  const register = async (form, portal = 'org', remember = true) => {
    const payload = portal === 'customer'
      ? await authApi.customerRegister(form)
      : await authApi.orgRegister(form);
    const returnedRole = displayRole(payload.user?.role);
    if (portal === 'org' && !isOrgRole(returnedRole)) {
      throw new Error('Organization registration did not return a valid organization role.');
    }
    if (portal === 'customer' && !isCustomerRole(returnedRole)) {
      throw new Error('Customer registration did not return a customer role.');
    }
    return persistSession(payload, remember);
  };

  const selectRole = (roleKey) => {
    const selectedRole = roleMap[roleKey] || roleMap.support_agent;
    const updated = { ...user, role: selectedRole };
    const storage = localStorage.getItem('authUser') ? localStorage : sessionStorage;
    storage.setItem('authUser', JSON.stringify(updated));
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
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, selectRole, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
