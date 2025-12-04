import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyCredentials, verifyAdminUnlockToken, createAdminUnlockToken } from '@/utils/security';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);
  const [isPermanentBlock, setIsPermanentBlock] = useState(false);

  useEffect(() => {
    // Verificar si hay una sesión activa en localStorage
    const storedAuth = localStorage.getItem('auth_session');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }

    // Verificar si hay bloqueo permanente
    const permanentBlock = localStorage.getItem('auth_permanent_block');
    if (permanentBlock === 'true') {
      setIsPermanentBlock(true);
      setIsBlocked(true);
      setBlockTimeLeft(-1); // -1 indica bloqueo permanente
    }

    // Verificar si hay bloqueo temporal activo
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
    try {
      // Verificar si está bloqueado
      if (isBlocked) {
        const errorMsg = isPermanentBlock
          ? 'CUENTA BLOQUEADA PERMANENTEMENTE. Contacta al administrador para desbloquear.'
          : `Cuenta bloqueada temporalmente. Intenta en ${blockTimeLeft} segundos.`;
        return {
          success: false,
          error: errorMsg
        };
      }

      // Validaciones básicas de seguridad
      if (!username || !password) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem('auth_attempts', newAttempts.toString());

        // Bloquear después de 5 intentos
        if (newAttempts >= 7) {
          // Bloqueo PERMANENTE después de 7 intentos
          localStorage.setItem('auth_permanent_block', 'true');
          setIsPermanentBlock(true);
          setIsBlocked(true);
          setBlockTimeLeft(-1);
          return { success: false, error: 'CUENTA BLOQUEADA PERMANENTEMENTE. Contacta al administrador para desbloquear.' };
        } else if (newAttempts >= 6) {
          // Bloqueo de 6 HORAS después del 6to intento
          const blockDuration = 6 * 60 * 60; // 6 horas en segundos
          const blockUntil = Date.now() + (blockDuration * 1000);
          localStorage.setItem('auth_block_until', blockUntil.toString());
          setIsBlocked(true);
          setBlockTimeLeft(blockDuration);
          return { success: false, error: `Demasiados intentos fallidos. Cuenta bloqueada por 6 horas.` };
        } else if (newAttempts >= 5) {
          // Bloqueo de 30 MINUTOS después del 5to intento
          const blockDuration = 30 * 60; // 30 minutos en segundos
          const blockUntil = Date.now() + (blockDuration * 1000);
          localStorage.setItem('auth_block_until', blockUntil.toString());
          setIsBlocked(true);
          setBlockTimeLeft(blockDuration);
          return { success: false, error: `Demasiados intentos fallidos. Cuenta bloqueada por 30 minutos.` };
        }

        return { success: false, error: 'Usuario y contraseña son requeridos' };
      }

      // Verificar credenciales usando el sistema de hash seguro
      console.log('🔐 Intentando verificar credenciales...');
      console.log('👤 Usuario:', username);
      console.log('🔑 Password length:', password.length);

      const isValid = verifyCredentials(username, password);
      console.log('🔍 Resultado de verificación:', isValid);

      if (isValid) {
        // Resetear contador de intentos en login exitoso
        console.log('✅ Credenciales válidas - Login exitoso');
        setLoginAttempts(0);
        localStorage.removeItem('auth_attempts');
        localStorage.removeItem('auth_block_until');
        localStorage.removeItem('auth_permanent_block');
        setIsPermanentBlock(false);

        setIsAuthenticated(true);
        localStorage.setItem('auth_session', 'true');

        // Delay pequeño para UX
        await new Promise(resolve => setTimeout(resolve, 500));

        return { success: true };
      } else {
        // Incrementar contador de intentos fallidos
        console.log('❌ Credenciales inválidas - Incrementando contador');
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem('auth_attempts', newAttempts.toString());

        // Delay progresivo para prevenir brute force
        const delay = Math.min(3000, 500 * Math.pow(1.8, Math.max(0, newAttempts - 2)));
        console.log(`⏳ Aplicando delay de ${delay}ms antes del bloqueo`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Sistema de bloqueo progresivo más agresivo
        if (newAttempts >= 7) {
          // Bloqueo PERMANENTE después de 7 intentos
          console.log('🚫 Bloqueo permanente activado');
          localStorage.setItem('auth_permanent_block', 'true');
          setIsPermanentBlock(true);
          setIsBlocked(true);
          setBlockTimeLeft(-1);
          return { success: false, error: 'CUENTA BLOQUEADA PERMANENTEMENTE. Contacta al administrador para desbloquear.' };
        } else if (newAttempts >= 6) {
          // Bloqueo de 6 HORAS después del 6to intento
          console.log('🚫 Bloqueo de 6 horas activado');
          const blockDuration = 6 * 60 * 60; // 6 horas en segundos
          const blockUntil = Date.now() + (blockDuration * 1000);
          localStorage.setItem('auth_block_until', blockUntil.toString());
          setIsBlocked(true);
          setBlockTimeLeft(blockDuration);
          return { success: false, error: `Demasiados intentos fallidos. Cuenta bloqueada por 6 horas.` };
        } else if (newAttempts >= 5) {
          // Bloqueo de 30 MINUTOS después del 5to intento
          console.log('🚫 Bloqueo de 30 minutos activado');
          const blockDuration = 30 * 60; // 30 minutos en segundos
          const blockUntil = Date.now() + (blockDuration * 1000);
          localStorage.setItem('auth_block_until', blockUntil.toString());
          setIsBlocked(true);
          setBlockTimeLeft(blockDuration);
          return { success: false, error: `Demasiados intentos fallidos. Cuenta bloqueada por 30 minutos.` };
        }

        return { success: false, error: 'Credenciales inválidas' };
      }
    } catch (error) {
      console.error('💥 Error en login:', error);
      return { success: false, error: 'Error inesperado en el sistema de autenticación' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth_session');
    // No resetear intentos fallidos al hacer logout
  };

  const adminUnlock = (unlockToken) => {
    if (verifyAdminUnlockToken(unlockToken)) {
      // Desbloquear cuenta
      setIsBlocked(false);
      setIsPermanentBlock(false);
      setBlockTimeLeft(0);
      setLoginAttempts(0);

      // Limpiar localStorage
      localStorage.removeItem('auth_permanent_block');
      localStorage.removeItem('auth_block_until');
      localStorage.removeItem('auth_attempts');

      return { success: true, message: 'Cuenta desbloqueada exitosamente' };
    }
    return { success: false, error: 'Token de desbloqueo inválido' };
  };

  const generateAdminToken = () => {
    const token = createAdminUnlockToken();
    return { success: true, token, message: 'Token generado. Copia este token para desbloquear cuentas bloqueadas.' };
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    loginAttempts,
    isBlocked,
    blockTimeLeft,
    isPermanentBlock,
    adminUnlock,
    generateAdminToken
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
