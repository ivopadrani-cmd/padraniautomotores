import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Key, Search, Car, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { infoautoAPI } from '../services/infoautoApi';

// Hooks personalizados
import {
  useInfoAutoCredentials,
  useTestConnection,
  useLastUpdate,
  useCurrentYear,
  useBrands,
  useAllBrandsWithGroups,
  useModelsByBrand,
  useGroupsByBrand,
  useModelByCodia,
  useListPriceByCodia,
  useCompleteModelInfo,
  useUpdateVehicleInfoAutoPrice,
  useCheckForUpdates,
  useIntegrationStats,
  useAutoIntegration
} from '../hooks/useInfoAuto';

export default function InfoAutoTester() {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [codiaSearch, setCodiaSearch] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showTokenSection, setShowTokenSection] = useState(false);

  // Credentials management
  const { setCredentials, getCredentials, hasCredentials } = useInfoAutoCredentials();

  // Connection test
  const { data: connectionTest, isLoading: testingConnection } = useTestConnection();

  // Main data queries
  const { data: lastUpdate, isLoading: loadingLastUpdate } = useLastUpdate();
  const { data: currentYear, isLoading: loadingCurrentYear } = useCurrentYear();
  const { data: brands, isLoading: loadingBrands } = useBrands();
  const { data: allBrandsWithGroups, isLoading: loadingAllBrands } = useAllBrandsWithGroups();
  const { data: models, isLoading: loadingModels } = useModelsByBrand(selectedBrand);
  const { data: modelInfo, isLoading: loadingModel } = useModelByCodia(codiaSearch);
  const { data: completeModel, isLoading: loadingCompleteModel } = useCompleteModelInfo(codiaSearch);

  // Integration features
  const { data: integrationStats, isLoading: loadingStats } = useIntegrationStats();
  const { isRunning: integrationRunning, startIntegration, stopIntegration, manualUpdate } = useAutoIntegration();

  // Update mutation
  const updatePriceMutation = useUpdateVehicleInfoAutoPrice();

  // Initialize credentials inputs
  useEffect(() => {
    const credentials = getCredentials();
    setUsernameInput(credentials.username);
    setPasswordInput(credentials.password);
  }, []);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (usernameInput.trim() && passwordInput.trim()) {
      await setCredentials(usernameInput.trim(), passwordInput.trim());
      setShowTokenSection(true);
    } else {
      toast.error('Usuario y contraseña son requeridos');
    }
  };

  // Función para obtener información de tokens
  const getTokenInfo = () => {
    const api = infoautoAPI;
    return {
      hasCredentials: api.hasCredentials(),
      accessToken: api.accessToken ? `${api.accessToken.substring(0, 20)}...` : null,
      refreshToken: api.refreshToken ? `${api.refreshToken.substring(0, 20)}...` : null,
      tokenExpiry: api.tokenExpiry ? new Date(api.tokenExpiry).toLocaleString() : null,
      isTokenValid: api.isTokenValid()
    };
  };

  const handleBrandChange = (brandId) => {
    setSelectedBrand(brandId);
    setSelectedModel('');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasApiKey = hasCredentials();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">InfoAuto - Buscador de Precios</h1>
          <p className="text-gray-600 mt-2">Sistema de consulta de precios de vehículos con autenticación JWT</p>
          <p className="text-sm text-amber-600 mt-1 font-medium">
            ⚠️ Requiere credenciales válidas de InfoAuto (usuario/contraseña)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium">
            {hasCredentials() ? 'Credenciales Configuradas' : 'Credenciales No Configuradas'}
          </span>
          {hasCredentials() && <CheckCircle className="w-5 h-5 text-green-600" />}
        </div>
      </div>

      {/* Credentials Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configuración de InfoAuto Demo
          </CardTitle>
          <CardDescription>
            Credenciales de acceso para la API demo de InfoAuto (JWT Authentication)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>⚠️ NORMAS CRÍTICAS DE USO (NO INFRINGIR):</strong><br />
              • <strong>NO generes access tokens nuevos por cada consulta</strong> (mal uso = bloqueo)<br />
              • <strong>Reutiliza access tokens</strong> mientras sean válidos (1 hora)<br />
              • <strong>Usa refresh tokens para renovación automática</strong> (válidos 24 horas)<br />
              • <strong>Implementa persistencia de tokens</strong> (localStorage/cron jobs/Redis)<br />
              • <strong>Respeta límites de rate limiting</strong> para evitar bloqueos<br />
              • <strong>Access tokens por Basic Auth inicial</strong>, luego Bearer tokens
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertDescription>
              <strong>Autenticación JWT InfoAuto:</strong><br />
              • <strong>POST /auth/login</strong> con Basic Auth → access_token + refresh_token<br />
              • <strong>POST /auth/refresh</strong> con Bearer refresh_token → nuevo access_token<br />
              • <strong>Access token:</strong> 1 hora de validez<br />
              • <strong>Refresh token:</strong> 24 horas de validez<br />
              • <strong>Recomendación:</strong> Renovación automática cada 10 minutos
            </AlertDescription>
          </Alert>

          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Usuario (Email)</Label>
                <Input
                  id="username"
                  type="email"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="tu-email@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Tu contraseña de InfoAuto"
                />
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
              <strong>📧 Credenciales de DEMO proporcionadas por email:</strong><br />
              <strong>Usuario:</strong> ivopadrani@gmail.com<br />
              <strong>Contraseña:</strong> padrani.API2025
            </div>

            <Button type="submit" disabled={!usernameInput.trim() || !passwordInput.trim()}>
              Configurar Credenciales y Autenticar
            </Button>
          </form>

          {!hasCredentials() && (
            <Alert>
              <AlertDescription>
                <strong>Sin credenciales:</strong> Configura usuario y contraseña para acceder a la API JWT de InfoAuto.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {!hasCredentials() && (
        <Alert>
          <AlertDescription>
            Configura tus credenciales para acceder a todas las funcionalidades de InfoAuto.
          </AlertDescription>
        </Alert>
      )}

      {hasCredentials() && (
        <div className="space-y-6">
          {/* Token Verification Section */}
          {showTokenSection && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Verificación de Tokens JWT
                </CardTitle>
                <CardDescription>
                  Estado de autenticación y tokens generados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Estado de Autenticación</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {getTokenInfo().isTokenValid ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">Tokens Válidos</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600 font-medium">Sin Tokens Válidos</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Access Token</Label>
                      <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs break-all">
                        {getTokenInfo().accessToken || 'No generado'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Refresh Token</Label>
                      <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs break-all">
                        {getTokenInfo().refreshToken || 'No generado'}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Expira el</Label>
                      <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                        {getTokenInfo().tokenExpiry || 'No disponible'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => {
                      // Forzar renovación manual
                      infoautoAPI.clearTokens();
                      window.location.reload();
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Forzar Renovación
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Buscador de Vehículos InfoAuto
              </CardTitle>
              <CardDescription>
                Selecciona marca y modelo para consultar precios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CORS Warning */}
              <Alert>
                <AlertDescription>
                  <strong>⚠️ Nota sobre CORS:</strong> La API demo de InfoAuto no permite requests desde localhost por seguridad.
                  En producción con credenciales reales, funcionará correctamente desde tu dominio.
                </AlertDescription>
              </Alert>

              {/* Vehicle Search Interface */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Brand Selection */}
                <div>
                  <Label className="text-sm font-medium">Marca</Label>
                  <Select value={selectedBrand} onValueChange={handleBrandChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingBrands ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          <span>Cargando...</span>
                        </div>
                      ) : (
                        brands?.results?.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model Selection */}
                <div>
                  <Label className="text-sm font-medium">Modelo</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    disabled={!selectedBrand}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={selectedBrand ? "Seleccionar modelo" : "Primero selecciona marca"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingModels ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          <span>Cargando...</span>
                        </div>
                      ) : (
                        models?.results?.map((model) => (
                          <SelectItem key={model.codia} value={model.codia}>
                            {model.name} ({model.year})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Check Button */}
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      if (selectedModel) {
                        setCodiaSearch(selectedModel);
                        toast.success('Consultando precios...');
                      } else {
                        toast.error('Selecciona un modelo primero');
                      }
                    }}
                    disabled={!selectedModel}
                    className="w-full"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Ver Precios
                  </Button>
                </div>
              </div>

              {/* Search by CODIA */}
              <Separator />
              <div>
                <Label className="text-sm font-medium">O buscar directamente por CODIA</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={codiaSearch}
                    onChange={(e) => setCodiaSearch(e.target.value)}
                    placeholder="Ej: VW001AA"
                    className="font-mono"
                  />
                  <Button
                    onClick={() => setCodiaSearch(codiaSearch)}
                    disabled={!codiaSearch.trim() || loadingCompleteModel}
                  >
                    {loadingCompleteModel && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Buscar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {completeModel && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Resultado: {completeModel.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">CODIA</Label>
                    <p className="font-mono text-lg">{completeModel.codia}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Año</Label>
                    <p className="text-lg">{completeModel.year}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Marca</Label>
                    <p className="text-lg">{completeModel.brand_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Grupo</Label>
                    <p className="text-lg">{completeModel.group_name}</p>
                  </div>
                </div>

                {completeModel.list_price && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium">Precio 0km Actual</Label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPrice(completeModel.list_price.price)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Actualizado: {formatDate(completeModel.list_price.updated_at)}
                    </p>
                  </div>
                )}

                <Alert>
                  <AlertDescription>
                    <strong>Nota:</strong> Los precios usados por año estarían disponibles aquí.
                    Esta funcionalidad se implementará cuando tengamos acceso completo a la API.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Integration Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Integración Automática</CardTitle>
              <CardDescription>Estado del sistema de actualización automática</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold">Última Actualización API</h3>
                    <p className="text-sm text-gray-600">
                      {lastUpdate ? formatDate(lastUpdate.datetime) : 'No disponible'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-semibold">Próxima Renovación</h3>
                    <p className="text-sm text-gray-600">Cada 50 minutos</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <h3 className="font-semibold">Estado</h3>
                    <p className="text-sm text-gray-600">
                      {hasCredentials() ? 'Configurado' : 'Sin configurar'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
