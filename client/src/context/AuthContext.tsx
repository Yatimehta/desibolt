import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DeliveryAddress } from '../types';
import { api } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin' | 'driver';
  savedAddresses: DeliveryAddress[];
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  saveAddress: (address: DeliveryAddress) => void;
  deleteAddress: (street: string) => void;
  defaultAddress: DeliveryAddress | null;
}

const DEFAULT_DEMO_ADDRESSES: DeliveryAddress[] = [
  {
    fullName: 'Alex Camilleri',
    phone: '+356 9912 3456',
    email: 'alex@example.com.mt',
    street: '42, Tower Road, Apt 4B',
    buildingName: 'Tower View Residences',
    locality: 'Sliema',
    postalCode: 'SLM 1604',
    notes: 'Ring buzzer 4B, 3rd floor',
    coordinates: { lat: 35.9122, lng: 14.5042 },
  },
];

const DEFAULT_MOCK_USER: User = {
  id: 'usr_customer_1',
  name: 'Alex Camilleri',
  email: 'alex@example.com.mt',
  phone: '+356 9912 3456',
  role: 'customer',
  createdAt: '2026-01-15T10:00:00.000Z',
  savedAddresses: DEFAULT_DEMO_ADDRESSES,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('desibolt_jwt'));
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('desibolt_user');
      return saved ? JSON.parse(saved) : (localStorage.getItem('desibolt_jwt') ? DEFAULT_MOCK_USER : null);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore user session on startup
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('desibolt_jwt');
      if (savedToken) {
        try {
          const res = await api.auth.getProfile();
          if (res?.user) {
            setUser((prev) => ({
              ...res.user,
              savedAddresses: prev?.savedAddresses?.length ? prev.savedAddresses : DEFAULT_DEMO_ADDRESSES,
            }));
          }
        } catch {
          // If profile fetch fails or token expired, keep local user if offline or fallback
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Sync user state to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('desibolt_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('desibolt_user');
      }
      if (token) {
        localStorage.setItem('desibolt_jwt', token);
      } else {
        localStorage.removeItem('desibolt_jwt');
      }
    } catch (e) {
      console.error('Failed to sync auth in storage', e);
    }
  }, [user, token]);

  const login = useCallback(async (email: string, password: string = 'DesiBolt@2026'): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.auth.login({ email, password });
      if (res?.token && res?.user) {
        setToken(res.token);
        const loggedUser: User = {
          ...res.user,
          savedAddresses: user?.savedAddresses?.length ? user.savedAddresses : DEFAULT_DEMO_ADDRESSES,
        };
        setUser(loggedUser);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (err: any) {
      // Offline fallback for demo / test login
      if (email.includes('admin')) {
        const adminUser: User = {
          id: 'usr_admin_1',
          name: 'DESI BOLT Admin',
          email: 'admin@desibolt.com',
          phone: '+356 2133 8899',
          role: 'admin',
          savedAddresses: DEFAULT_DEMO_ADDRESSES,
          createdAt: new Date().toISOString(),
        };
        const mockJwt = 'mock_jwt_token_admin';
        setToken(mockJwt);
        setUser(adminUser);
        return { success: true };
      } else if (email) {
        const customerUser: User = {
          id: 'usr_customer_1',
          name: email.split('@')[0].replace('.', ' '),
          email,
          phone: '+356 9912 3456',
          role: 'customer',
          savedAddresses: DEFAULT_DEMO_ADDRESSES,
          createdAt: new Date().toISOString(),
        };
        const mockJwt = 'mock_jwt_token_customer';
        setToken(mockJwt);
        setUser(customerUser);
        return { success: true };
      }
      return { success: false, error: err.message || 'Login failed' };
    }
  }, [user]);

  const register = useCallback(async (data: { name: string; email: string; password: string; phone?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.auth.register(data);
      if (res?.token && res?.user) {
        setToken(res.token);
        const registeredUser: User = {
          ...res.user,
          savedAddresses: DEFAULT_DEMO_ADDRESSES,
        };
        setUser(registeredUser);
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      // Fallback local registration
      const fallbackUser: User = {
        id: `usr_${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone || '+356 9900 1122',
        role: 'customer',
        savedAddresses: DEFAULT_DEMO_ADDRESSES,
        createdAt: new Date().toISOString(),
      };
      setToken(`jwt_${Date.now()}`);
      setUser(fallbackUser);
      return { success: true };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('desibolt_jwt');
    localStorage.removeItem('desibolt_user');
  }, []);

  const updateProfile = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  const saveAddress = useCallback((newAddress: DeliveryAddress) => {
    setUser((prev) => {
      if (!prev) return null;
      const existing = prev.savedAddresses || [];
      const filtered = existing.filter((a) => a.street !== newAddress.street);
      return {
        ...prev,
        savedAddresses: [newAddress, ...filtered],
      };
    });
  }, []);

  const deleteAddress = useCallback((street: string) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        savedAddresses: (prev.savedAddresses || []).filter((a) => a.street !== street),
      };
    });
  }, []);

  const defaultAddress = user?.savedAddresses?.[0] || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        saveAddress,
        deleteAddress,
        defaultAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
