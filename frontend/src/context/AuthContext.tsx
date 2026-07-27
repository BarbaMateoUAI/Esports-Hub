import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthState {
  token: string | null;
  roles: string[] | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, roles: string[]) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    let parsedRoles: string[] | null = null;
    try {
      const rolesStr = localStorage.getItem('roles');
      if (rolesStr) {
        const parsed = JSON.parse(rolesStr);
        if (Array.isArray(parsed)) {
          parsedRoles = parsed;
        } else if (typeof parsed === 'string') {
          // Fallback for old single role string that got parsed
          parsedRoles = [parsed];
        }
      }
    } catch (e) {
      // If it fails to parse (e.g. old plain string), clear it
      localStorage.removeItem('roles');
    }

    return {
      token: localStorage.getItem('token'),
      roles: parsedRoles
    };
  });

  const login = (token: string, roles: string[]) => {
    localStorage.setItem('token', token);
    localStorage.setItem('roles', JSON.stringify(roles));
    setAuthState({ token, roles });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    setAuthState({ token: null, roles: null });
  };

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      logout,
      isAuthenticated: !!authState.token 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
