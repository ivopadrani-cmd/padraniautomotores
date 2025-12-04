import React, { createContext, useContext, useState, useEffect } from 'react';

// Credenciales válidas (ofuscadas para evitar inspección casual)
const getValidCredentials = () => ({
  username: atob('aXZvcGFkcmFuaUBnbWFpbC5jb20='), // ivopadrani@gmail.com
  password: atob('MXZpY3Rvcmlh') // 1victoria
});

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);

  useEffect(() => {
    // Verificar si hay una sesión activa en localStorage
    const storedAuth = localStorage.getItem('auth_session');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }

    // Verificar si hay bloqueo activo
    const blockUntil = localStorage.getItem('auth_block_until');
    if (blockUntil) {
      const blockTime = parseInt(blockUntil);
      const now = Date.now();
      if (now < blockTime) {
        setIsBlocked(true);
        setBlockTimeLeft(Math.ceil((blockTime - now) / 1000));
        // Timer para desbloquear automáticamente
        const timer = setInterval(() => {
          const remaining = Math.ceil((blockTime - Date.now()) / 1000);
          if (remaining <= 0) {
            setIsBlocked(false);
            setBlockTimeLeft(0);
            localStorage.removeItem('auth_block_until');
            clearInterval(timer);
          } else {
            setBlockTimeLeft(remaining);
          }
        }, 1000);
        return () => clearInterval(timer);
      } else {
        localStorage.removeItem('auth_block_until');
      }
    }

    // Verificar intentos fallidos
    const storedAttempts = localStorage.getItem('auth_attempts');
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts));
    }

    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    // Verificar si está bloqueado
    if (isBlocked) {
      return {
        success: false,
        error: `Cuenta bloqueada temporalmente. Intenta en ${blockTimeLeft} segundos.`
      };
    }

    // Obtener credenciales válidas
    const validCredentials = getValidCredentials();

    // Validaciones básicas de seguridad
    if (!username || !password) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('auth_attempts', newAttempts.toString());

      // Bloquear después de 5 intentos
      if (newAttempts >= 5) {
        const blockDuration = Math.min(300, 30 * Math.pow(2, newAttempts - 5)); // Máximo 5 minutos
        const blockUntil = Date.now() + (blockDuration * 1000);
        localStorage.setItem('auth_block_until', blockUntil.toString());
        setIsBlocked(true);
        setBlockTimeLeft(blockDuration);
        return { success: false, error: `Cuenta bloqueada por ${blockDuration} segundos debido a múltiples intentos fallidos.` };
      }

      return { success: false, error: 'Usuario y contraseña son requeridos' };
    }

    // Verificar credenciales (con delay para prevenir brute force)
    const isValid = username === validCredentials.username && password === validCredentials.password;

    if (isValid) {
      // Resetear contador de intentos en login exitoso
      setLoginAttempts(0);
      localStorage.removeItem('auth_attempts');
      localStorage.removeItem('auth_block_until');

      setIsAuthenticated(true);
      localStorage.setItem('auth_session', 'true');

      // Delay pequeño para UX
      await new Promise(resolve => setTimeout(resolve, 500));

      return { success: true };
    } else {
      // Incrementar contador de intentos fallidos
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('auth_attempts', newAttempts.toString());

      // Delay progresivo para prevenir brute force
      const delay = Math.min(2000, 500 * Math.pow(1.5, Math.max(0, newAttempts - 2)));
      await new Promise(resolve => setTimeout(resolve, delay));

      // Bloquear después de 5 intentos
      if (newAttempts >= 5) {
        const blockDuration = Math.min(300, 30 * Math.pow(2, newAttempts - 5));
        const blockUntil = Date.now() + (blockDuration * 1000);
        localStorage.setItem('auth_block_until', blockUntil.toString());
        setIsBlocked(true);
        setBlockTimeLeft(blockDuration);
        return { success: false, error: `Demasiados intentos fallidos. Cuenta bloqueada por ${blockDuration} segundos.` };
      }

      return { success: false, error: 'Credenciales inválidas' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth_session');
    // No resetear intentos fallidos al hacer logout
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    loginAttempts,
    isBlocked,
    blockTimeLeft
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
