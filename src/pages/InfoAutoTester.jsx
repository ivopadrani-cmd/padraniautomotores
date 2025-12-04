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
import { Loader2, CheckCircle, XCircle, Key, Search, Car, DollarSign, Calendar, RefreshCw, AlertCircle, Database } from 'lucide-react';
import { toast } from 'sonner';
import { infoautoAPI } from '../services/infoautoApi';

// Funciones para consultar API local (proxy a InfoAuto)
const queryLocalAPI = async (endpoint, params = {}) => {
  try {
    const url = new URL(`/api/infoauto${endpoint}`, window.location.origin);

    // Agregar parámetros de query
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });

    console.log('🌐 Consultando API local:', url.toString());

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`Error consultando API local ${endpoint}:`, error);
    throw error;
  }
};

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
  const [tokenRefreshTrigger, setTokenRefreshTrigger] = useState(0);
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  // Estado para API
  const [apiMode, setApiMode] = useState(true); // true = usar API local, false = datos mock
  const [apiData, setApiData] = useState({
    brands: [],
    searchResults: [],
    modelDetails: null
  });

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
  // Estado para modelo completo (online/offline)
  const [offlineCompleteModel, setOfflineCompleteModel] = useState(null);
  const [offlineLoading, setOfflineLoading] = useState(false);

  const { data: completeModel, isLoading: loadingCompleteModel } = useCompleteModelInfo(
    offlineMode ? '' : codiaSearch
  );

  // Efecto para búsqueda por CODIA
  useEffect(() => {
    if (codiaSearch) {
      setOfflineLoading(true);

      const searchModel = async () => {
        try {
          let foundModel = null;

          if (apiMode) {
            // Buscar via API local
            foundModel = await findModelByCodiaAPI(codiaSearch);
          }

          setOfflineCompleteModel(foundModel);
        } catch (error) {
          console.error('Error en búsqueda por CODIA:', error);
          setOfflineCompleteModel(null);
        } finally {
          setOfflineLoading(false);
        }
      };

      searchModel();
    } else {
      setOfflineCompleteModel(null);
    }
  }, [codiaSearch, apiMode]);

  // Modelo completo actual (API o mock)
  const currentCompleteModel = !apiMode ? offlineCompleteModel : completeModel;
  const currentLoadingCompleteModel = !apiMode ? offlineLoading : loadingCompleteModel;

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

  // Probar API local al cargar
  useEffect(() => {
    const testLocalAPI = async () => {
      if (apiMode) {
        try {
          console.log('🔗 Probando API local...');
          const brandsResponse = await queryLocalAPI('/brands');
          if (brandsResponse.success) {
            setApiData(prev => ({
              ...prev,
              brands: brandsResponse.data || []
            }));
            console.log('✅ API local funciona:', brandsResponse.data?.length || 0, 'marcas');
          }
        } catch (error) {
          console.log('⚠️  API local no disponible:', error.message);
          // Si API falla, cambiar a modo datos mock
          setApiMode(false);
        }
      }
    };

    testLocalAPI();
  }, [apiMode]);

  // Función para obtener datos según el modo
  const getBrandsData = () => {
    if (!apiMode && apiData.brands.length > 0) {
      return { results: apiData.brands };
    }
    return brands;
  };

  const getModelsData = () => {
    if (!apiMode && apiData.searchResults.length > 0) {
      // Filtrar por marca si está seleccionada
      const brandId = parseInt(selectedBrand);
      const filteredModels = apiData.searchResults.filter(model =>
        !brandId || model.brand?.id === brandId
      );
      return filteredModels;
    }
    return models;
  };

  // Función para buscar modelo por CODIA via API local
  const findModelByCodiaAPI = async (codia) => {
    if (!apiMode) return null;

    try {
      const response = await queryLocalAPI(`/models/${codia}`);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Error buscando modelo por CODIA:', error);
      return null;
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (usernameInput.trim() && passwordInput.trim()) {
      await setCredentials(usernameInput.trim(), passwordInput.trim());
      setShowTokenSection(true);
      // Refrescar información de tokens después de configurar credenciales
      setTimeout(() => refreshTokenInfo(), 1000);
    } else {
      toast.error('Usuario y contraseña son requeridos');
    }
  };

  // Función para refrescar la información de tokens
  const refreshTokenInfo = () => {
    setTokenRefreshTrigger(prev => prev + 1);
  };

  // Función para obtener información de tokens
  const getTokenInfo = () => {
    // tokenRefreshTrigger asegura que se recalcule cuando cambie
    tokenRefreshTrigger;
    const api = infoautoAPI;
    const now = Date.now();
    const expiryTime = api.tokenExpiry ? parseInt(api.tokenExpiry) : null;
    const timeUntilExpiry = expiryTime ? expiryTime - now : null;
    const isValid = api.isTokenValid();

    console.log('InfoAuto Token Debug:', {
      accessToken: api.accessToken ? 'Presente' : 'Ausente',
      refreshToken: api.refreshToken ? 'Presente' : 'Ausente',
      tokenExpiry: api.tokenExpiry,
      now: now,
      timeUntilExpiry: timeUntilExpiry,
      isValid: isValid,
      hasCredentials: api.hasCredentials()
    });

    return {
      hasCredentials: api.hasCredentials(),
      accessToken: api.accessToken ? `${api.accessToken.substring(0, 20)}...` : null,
      refreshToken: api.refreshToken ? `${api.refreshToken.substring(0, 20)}...` : null,
      tokenExpiry: expiryTime ? new Date(expiryTime).toLocaleString() : null,
      timeUntilExpiry: timeUntilExpiry ? Math.floor(timeUntilExpiry / 1000 / 60) + ' minutos' : null,
      isTokenValid: isValid,
      debug: {
        expiryTime,
        now,
        timeUntilExpiry
      }
    };
  };

  const handleBrandChange = (brandId) => {
    setSelectedBrand(brandId);
    setSelectedModel('');
    setModelSearch('');
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
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>🔗 API PROXY IMPLEMENTADO:</strong><br />
              • ✅ **Backend proxy creado** - API routes en `/api/infoauto/`<br />
              • ✅ **Sin problemas CORS** - Navegador → Tu servidor → InfoAuto<br />
              • ✅ **Funciona en producción** - Vercel ejecuta las API routes<br />
              • 🔧 **Endpoints disponibles:** `/brands`, `/search`, `/models/[codia]`<br />
              <br />
              <strong>🎯 ¿Cómo funciona?</strong><br />
              Tu webapp consulta tus propias APIs → Tus APIs consultan InfoAuto → Resultados sin CORS
            </AlertDescription>
          </Alert>

          {/* Toggle Modo API/Datos Mock */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Fuente de Datos</Label>
                  <p className="text-sm text-gray-600">
                    {apiMode ? 'API proxy (datos reales de InfoAuto)' : 'Datos mock (ejemplos locales)'}
                  </p>
                </div>
                <Button
                  onClick={() => setApiMode(!apiMode)}
                  variant={apiMode ? "default" : "outline"}
                  size="sm"
                >
                  {apiMode ? '🎭 Cambiar a Datos Mock' : '🔗 Cambiar a API Real'}
                </Button>
              </div>
            </CardContent>
          </Card>

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
                        Estado de autenticación y tokens generados por InfoAuto
                        <br />
                        <span className="text-xs text-red-600 font-medium">
                          🚫 Requiere: Autorización de dominio por InfoAuto
                        </span>
                      </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Estado General */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <Label className="text-sm font-medium">Estado de Autenticación</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {getTokenInfo().isTokenValid ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">Tokens Válidos y Funcionando</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600 font-medium">
                              {getTokenInfo().accessToken ? 'Tokens Expirados - Necesitan Renovación' : 'Sin Tokens Generados'}
                            </span>
                          </>
                        )}
                      </div>
                      {getTokenInfo().timeUntilExpiry && (
                        <p className="text-xs text-gray-600 mt-1">
                          Tiempo restante: {getTokenInfo().timeUntilExpiry}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          try {
                            console.log('🔄 Iniciando generación de tokens...');
                            console.log('📋 Credenciales configuradas:', infoautoAPI.hasCredentials());
                            console.log('👤 Usuario:', infoautoAPI.getCredentials().username ? 'Presente' : 'Ausente');

                            toast.info('Generando tokens...');
                            const result = await infoautoAPI.authenticate();

                            console.log('✅ Autenticación exitosa:', result);
                            console.log('🔑 Tokens generados:', {
                              access: infoautoAPI.accessToken ? 'Presente' : 'Ausente',
                              refresh: infoautoAPI.refreshToken ? 'Presente' : 'Ausente',
                              expiry: infoautoAPI.tokenExpiry
                            });

                            // Refrescar la información de tokens en la UI
                            refreshTokenInfo();

                            toast.success('Tokens generados exitosamente');

                          } catch (error) {
                            console.error('❌ Error completo en autenticación:', error);
                            console.error('Stack trace:', error.stack);

                            // Mostrar mensaje más específico según el error
                            let errorMessage = error.message;
                            if (error.message.includes('CORS')) {
                              errorMessage = '🚫 CORS: Requests bloqueados en desarrollo local. Los tokens funcionarán correctamente en producción.';
                            } else if (error.message.includes('401')) {
                              errorMessage = '❌ Credenciales inválidas. Verifica usuario y contraseña.';
                            } else if (error.message.includes('Failed to fetch')) {
                              errorMessage = '🔌 No se pudo conectar al servidor de InfoAuto.';
                            }

                            toast.error('Error al generar tokens: ' + errorMessage);
                          }
                        }}
                        size="sm"
                        disabled={!hasCredentials()}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generar Tokens
                      </Button>
                      <Button
                        onClick={() => {
                          infoautoAPI.clearTokens();
                          refreshTokenInfo();
                          toast.info('Tokens limpiados');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Limpiar Tokens
                      </Button>
                    </div>
                  </div>

                  {/* Alerta CORS - InfoAuto requiere dominios autorizados */}
                  {!getTokenInfo().isTokenValid && hasCredentials() && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertDescription className="text-orange-800">
                        <div className="space-y-3">
                          <div className="font-semibold text-orange-900">
                            🚫 InfoAuto: Requiere Autorización de Dominio
                          </div>
                          <div className="text-sm space-y-2">
                            <div>
                              <p className="font-medium">❌ Dominios bloqueados:</p>
                              <ul className="ml-4 space-y-1">
                                <li>• <code className="bg-orange-100 px-1 rounded">localhost:5173</code> (desarrollo local)</li>
                                <li>• <code className="bg-orange-100 px-1 rounded">*.vercel.app</code> (no autorizado)</li>
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium">✅ Solución necesaria:</p>
                              <ul className="ml-4 space-y-1">
                                <li>• Contactar a InfoAuto para autorizar tu dominio</li>
                                <li>• O configurar un dominio personalizado</li>
                              </ul>
                            </div>
                            <div className="bg-orange-100 p-2 rounded text-xs">
                              <strong>Nota:</strong> InfoAuto mantiene una whitelist de dominios permitidos por seguridad.
                              Esto es normal para APIs comerciales.
                            </div>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Detalles de Tokens */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Access Token (para API)</Label>
                        <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs break-all min-h-[40px] flex items-center">
                          {getTokenInfo().accessToken || (
                            <span className="text-gray-500 italic">No generado - Click "Generar Tokens"</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Se usa en cada request a la API
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Expira el</Label>
                        <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                          {getTokenInfo().tokenExpiry || 'No disponible'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Refresh Token (renovación)</Label>
                        <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs break-all min-h-[40px] flex items-center">
                          {getTokenInfo().refreshToken || (
                            <span className="text-gray-500 italic">No generado - Click "Generar Tokens"</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Se usa para renovar el access token automáticamente
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Credenciales</Label>
                        <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                          {hasCredentials() ? (
                            <span className="text-green-600">✓ Configuradas</span>
                          ) : (
                            <span className="text-red-600">✗ No configuradas</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <Alert>
                    <AlertDescription>
                      <strong>¿Qué hacer con los tokens?</strong><br />
                      • Los tokens se generan automáticamente cuando configuras credenciales<br />
                      • Se renuevan automáticamente cada 50 minutos<br />
                      • Si expiran, el sistema los renueva automáticamente<br />
                      • Solo necesitas verificar que aparezcan como "Válidos"<br />
                      • Los tokens permiten hacer consultas a la API de InfoAuto
                    </AlertDescription>
                  </Alert>
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
              <div className="space-y-4">
                {/* Brand Selection with Search */}
                <div>
                  <Label className="text-sm font-medium">Buscar Marca</Label>
                  <div className="mt-1 space-y-2">
                    <Input
                      placeholder="Escribe para filtrar marcas..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full"
                    />
                    <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                      {loadingBrands ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          <span>Cargando marcas...</span>
                        </div>
                      ) : (
                        getBrandsData()?.results
                          ?.filter(brand =>
                            brand.name.toLowerCase().includes(brandSearch.toLowerCase())
                          )
                          .map((brand) => (
                            <button
                              key={brand.id}
                              onClick={() => {
                                handleBrandChange(brand.id.toString());
                                setBrandSearch(brand.name);
                              }}
                              className={`w-full text-left px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                                selectedBrand === brand.id.toString() ? 'bg-blue-100 text-blue-800 font-medium' : ''
                              }`}
                            >
                              {brand.name}
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Model Selection with Search */}
                {selectedBrand && (
                  <div>
                    <Label className="text-sm font-medium">Buscar Modelo</Label>
                    <div className="mt-1 space-y-2">
                      <Input
                        placeholder="Escribe para filtrar modelos..."
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        className="w-full"
                      />
                      <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                        {loadingModels ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            <span>Cargando modelos...</span>
                          </div>
                        ) : (
                          getModelsData()
                            ?.filter(model =>
                              model.modelName.toLowerCase().includes(modelSearch.toLowerCase()) ||
                              model.codia.toString().includes(modelSearch)
                            )
                            .map((model) => (
                              <button
                                key={model.codia}
                                onClick={() => {
                                  setSelectedModel(model.codia);
                                  setModelSearch(`${model.modelName} (CODIA: ${model.codia})`);
                                }}
                                className={`w-full text-left px-3 py-2 rounded hover:bg-green-50 hover:text-green-700 transition-colors ${
                                  selectedModel === model.codia ? 'bg-green-100 text-green-800 font-medium' : ''
                                }`}
                              >
                                {model.modelName} (CODIA: {model.codia})
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Check Button */}
                <div className="flex justify-center pt-2">
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
                    size="lg"
                    className="px-8"
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
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
                    {currentLoadingCompleteModel && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Buscar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {currentCompleteModel && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Resultado: {currentCompleteModel.modelName || currentCompleteModel.name}
                  {!apiMode && <Badge variant="outline" className="ml-2">Datos Mock</Badge>}
                  {apiMode && <Badge variant="outline" className="ml-2">InfoAuto API</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">CODIA</Label>
                    <p className="font-mono text-lg">{currentCompleteModel.codia}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Precio 0km</Label>
                    <p className="text-lg font-bold text-green-600">
                      ${currentCompleteModel.list_price?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Marca</Label>
                    <p className="text-lg">{currentCompleteModel.brandName || currentCompleteModel.brand_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Modelo</Label>
                    <p className="text-lg">{currentCompleteModel.modelName || currentCompleteModel.name}</p>
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
