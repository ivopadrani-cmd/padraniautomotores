import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from './LoginForm';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Mostrar login si no está autenticado
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Mostrar aplicación si está autenticado
  return children;
}
