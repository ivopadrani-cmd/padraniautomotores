import React, { createContext, useContext, useState, useEffect } from 'react';

// Credenciales válidas
const VALID_CREDENTIALS = {
  username: 'ivopadrani@gmail.com',
  password: '1victoria'
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión activa en localStorage
    const storedAuth = localStorage.getItem('auth_session');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (username, password) => {
    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      setIsAuthenticated(true);
      localStorage.setItem('auth_session', 'true');
      return { success: true };
    }
    return { success: false, error: 'Credenciales inválidas' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth_session');
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
