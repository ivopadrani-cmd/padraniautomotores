import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Por favor ingresa tu email');
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const emailTrimmed = email.trim();
      const emailLower = emailTrimmed.toLowerCase();

      console.log('Intentando login con:', emailTrimmed);

      // Crear usuario básico (siempre funciona)
      const user = {
        id: Date.now().toString(),
        email: emailTrimmed,
        name: emailTrimmed.split('@')[0],
        role: emailLower.includes('ivopadrani') ? 'Gerente' : 'Vendedor',
        created_at: new Date().toISOString()
      };

      // Intentar guardar en base de datos si está disponible
      try {
        if (base44.entities?.User) {
          console.log('Intentando guardar en base de datos...');
          const savedUser = await base44.entities.User.create(user);
          if (savedUser) {
            console.log('Usuario guardado en DB:', savedUser);
            localStorage.setItem('current_user', JSON.stringify(savedUser));
            toast.success(`Bienvenido ${savedUser.name || savedUser.email}`);
            onLogin(savedUser);
            return;
          }
        }
      } catch (dbError) {
        console.warn('Error guardando en DB, usando localStorage:', dbError);
      }

      // Fallback: guardar solo en localStorage
      console.log('Usando localStorage fallback');
      localStorage.setItem('current_user', JSON.stringify(user));
      toast.success(`Bienvenido ${user.name}`);
      onLogin(user);

    } catch (error) {
      console.error('Login error:', error);
      setError('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Padrani Automotores
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Ingresa tu email para continuar
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Al continuar, aceptas acceder al sistema de gestión</p>
            <p className="mt-1">de Padrani Automotores</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
