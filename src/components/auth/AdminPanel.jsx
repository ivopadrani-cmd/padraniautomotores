import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Key, Unlock, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function AdminPanel() {
  const { generateAdminToken, adminUnlock } = useAuth();
  const [unlockToken, setUnlockToken] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateToken = () => {
    try {
      const result = generateAdminToken();
      if (result.success) {
        setGeneratedToken(result.token);
        toast.success('Token de desbloqueo generado');
      }
    } catch (error) {
      toast.error('Error al generar token');
    }
  };

  const handleUnlockAccount = async () => {
    if (!unlockToken.trim()) {
      toast.error('Ingresa un token de desbloqueo');
      return;
    }

    setIsLoading(true);
    try {
      const result = adminUnlock(unlockToken.trim());
      if (result.success) {
        toast.success(result.message);
        setUnlockToken('');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Error al desbloquear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Token copiado al portapapeles');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Shield className="w-5 h-5" />
              Panel de Administración - Sistema de Seguridad
            </CardTitle>
            <CardDescription>
              Gestión avanzada de bloqueos de cuenta y tokens de desbloqueo
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Generar Token de Desbloqueo */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Generar Token de Desbloqueo
                </h3>
              </div>

              <p className="text-sm text-slate-600">
                Crea un token único para desbloquear cuentas bloqueadas permanentemente.
                Comparte este token solo con usuarios autorizados.
              </p>

              <Button
                onClick={handleGenerateToken}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Key className="w-4 h-4 mr-2" />
                Generar Token de Desbloqueo
              </Button>

              {generatedToken && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="space-y-2">
                      <p className="font-medium">Token generado exitosamente:</p>
                      <div className="flex items-center gap-2 bg-green-100 p-2 rounded font-mono text-xs">
                        <code className="flex-1">{generatedToken}</code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(generatedToken)}
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-green-700">
                        ⚠️ Guarda este token en un lugar seguro. Es necesario para desbloquear cuentas.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Desbloquear Cuenta */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <Unlock className="w-4 h-4 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Desbloquear Cuenta
                </h3>
              </div>

              <p className="text-sm text-slate-600">
                Ingresa un token de desbloqueo válido para remover bloqueos permanentes.
              </p>

              <div className="space-y-2">
                <Label htmlFor="unlockToken">Token de Desbloqueo</Label>
                <Input
                  id="unlockToken"
                  type="text"
                  placeholder="Ingresa el token de desbloqueo..."
                  value={unlockToken}
                  onChange={(e) => setUnlockToken(e.target.value)}
                  className="font-mono"
                />
              </div>

              <Button
                onClick={handleUnlockAccount}
                disabled={isLoading || !unlockToken.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Desbloqueando...
                  </div>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Desbloquear Cuenta
                  </>
                )}
              </Button>
            </div>

            {/* Información de Seguridad */}
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-1">
                  <p className="font-medium">Información de Seguridad:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Los tokens son únicos y de un solo uso</li>
                    <li>• Los tokens expiran después de ser usados</li>
                    <li>• Solo el administrador puede generar tokens válidos</li>
                    <li>• Mantén los tokens en lugares seguros</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
