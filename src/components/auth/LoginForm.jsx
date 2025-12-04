import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Mail, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function LoginForm() {
  const { login, loginAttempts, isBlocked, blockTimeLeft, isPermanentBlock } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  useEffect(() => {
    setAttemptsLeft(Math.max(0, 5 - loginAttempts));
  }, [loginAttempts]);

  // Mostrar alerta crítica cuando falten pocos intentos
  const showCriticalAlert = loginAttempts >= 4 && loginAttempts < 5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        toast.success('Inicio de sesión exitoso');
        // Limpiar campos después de login exitoso
        setUsername('');
        setPassword('');
      } else {
        setError(result.error);
        // Solo mostrar toast si no es bloqueo (el bloqueo ya tiene su propio mensaje)
        if (!result.error.includes('bloqueada') && !result.error.includes('bloqueada')) {
          toast.error('Credenciales incorrectas');
        }
      }
    } catch (err) {
      setError('Error inesperado. Intenta nuevamente.');
      toast.error('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Padrani Automotores
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Sistema Interno de Gestión
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alerta de bloqueo */}
            {isBlocked && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-red-800 font-medium">
                  {isPermanentBlock ? (
                    <>
                      🚫 CUENTA BLOQUEADA PERMANENTEMENTE
                      <br />
                      <span className="text-sm font-normal">
                        Contacta al administrador para obtener un token de desbloqueo
                      </span>
                    </>
                  ) : (
                    <>
                      🚫 Cuenta bloqueada temporalmente
                      <br />
                      <span className="text-sm font-normal">
                        Tiempo restante: {Math.floor(blockTimeLeft / 3600)}:{Math.floor((blockTimeLeft % 3600) / 60).toString().padStart(2, '0')}:{(blockTimeLeft % 60).toString().padStart(2, '0')}
                      </span>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Alerta de intentos restantes */}
            {!isBlocked && loginAttempts > 0 && loginAttempts < 5 && (
              <Alert variant="destructive" className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-orange-800">
                  ⚠️ Intentos fallidos: {loginAttempts}/5
                  <br />
                  <span className="text-sm font-normal">
                    Te quedan {attemptsLeft} intento{attemptsLeft !== 1 ? 's' : ''} antes del bloqueo de 30 minutos
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Alerta crítica cerca del límite */}
            {!isBlocked && loginAttempts >= 4 && loginAttempts < 5 && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800 font-medium">
                  🚨 ¡ÚLTIMA OPORTUNIDAD!
                  <br />
                  <span className="text-sm font-normal">
                    Un intento fallido más bloqueará la cuenta por 30 minutos
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Alerta de error general */}
            {error && !isBlocked && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Usuario (Email)
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className={`w-full font-medium py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-white ${
                isBlocked
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black hover:bg-gray-800'
              }`}
              disabled={isLoading || isBlocked}
            >
              {isBlocked ? (
                <div className="flex items-center justify-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {isPermanentBlock ? 'Bloqueo Permanente' : `Bloqueado (${Math.floor(blockTimeLeft / 3600)}:${Math.floor((blockTimeLeft % 3600) / 60).toString().padStart(2, '0')}:${(blockTimeLeft % 60).toString().padStart(2, '0')})`}
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            <p className="text-xs text-gray-500">
              🔐 Sistema seguro - Acceso restringido
            </p>
            <p className="text-xs text-gray-400">
              Intentos fallidos se registran y pueden bloquear el acceso temporalmente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
