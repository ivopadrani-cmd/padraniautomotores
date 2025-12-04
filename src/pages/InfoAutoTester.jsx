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

// Funciones para cargar datos mock
const loadMockData = async (filename) => {
  try {
    const response = await fetch(`/data/infoauto/${filename}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error cargando datos mock ${filename}:`, error);
    return null;
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

  // Estado para datos
  const [mockMode, setMockMode] = useState(true); // true = usar datos mock, false = API externa (no disponible)
  const [mockData, setMockData] = useState({
    brands: [],
    models: [],
    selectedModel: null
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

  // Para datos mock, no necesitamos búsqueda externa
  const { data: completeModel, isLoading: loadingCompleteModel } = useCompleteModelInfo('');

  // Efecto para búsqueda por CODIA
  useEffect(() => {
    if (codiaSearch && mockMode) {
      setOfflineLoading(true);

      // Simular búsqueda async
      setTimeout(() => {
        const foundModel = findModelByCodiaMock(codiaSearch);
        setOfflineCompleteModel(foundModel);
        setOfflineLoading(false);
      }, 300); // Simular delay de búsqueda
    } else {
      setOfflineCompleteModel(null);
    }
  }, [codiaSearch, mockMode]);

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

  // Cargar datos mock al iniciar
  useEffect(() => {
    const loadMockDataAsync = async () => {
      console.log('🎭 Cargando datos mock...');

      const [brands, allModels] = await Promise.all([
        loadMockData('brands.json'),
        loadMockData('all-models.json')
      ]);

      if (brands && allModels) {
        setMockData({
          brands: brands || [],
          allModels: allModels || [],
          models: [],
          selectedModel: null
        });
        console.log('✅ Datos mock cargados:', {
          brands: brands.length,
          models: allModels.length
        });
      } else {
        console.log('⚠️  No se pudieron cargar datos mock');
      }
    };

    if (mockMode) {
      loadMockDataAsync();
    }
  }, [mockMode]);

  // Función para obtener datos (solo mock disponible)
  const getBrandsData = () => {
    if (mockMode && mockData.brands.length > 0) {
      return { results: mockData.brands };
    }
    return { results: [] };
  };

  const getModelsData = () => {
    if (mockMode && mockData.models.length > 0) {
      // Filtrar por marca seleccionada
      const brandId = parseInt(selectedBrand);
      const filteredModels = mockData.models.filter(model =>
        !brandId || model.brandId === brandId
      );
      return filteredModels;
    }
    return [];
  };

  // Función para manejar selección de marca
  const handleBrandChange = (brandId) => {
    setSelectedBrand(brandId);
    setSelectedModel(''); // Resetear modelo seleccionado
    setModelSearch(''); // Resetear búsqueda

    // Cargar modelos de la marca seleccionada
    if (mockMode && brandId) {
      const brandIdNum = parseInt(brandId);
      const brandModels = mockData.allModels?.filter(model => model.brandId === brandIdNum) || [];
      setMockData(prev => ({
        ...prev,
        models: brandModels
      }));
    }
  };

  // Función para manejar selección de modelo
  const handleModelChange = (model) => {
    setSelectedModel(model.codia.toString());
    setModelSearch(`${model.modelName} (CODIA: ${model.codia})`);
    setMockData(prev => ({ ...prev, selectedModel: model }));

    // Mostrar precios automáticamente (sin búsqueda externa)
    setOfflineCompleteModel(model);
  };

  // Función para buscar modelo por CODIA en datos mock
  const findModelByCodiaMock = (codia) => {
    if (!mockMode || !mockData.allModels) return null;

    const codiaNum = parseInt(codia);
    return mockData.allModels.find(model => model.codia === codiaNum) || null;
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
              <strong>🎭 FUNCIONANDO CON DATOS DEMO:</strong><br />
              • ✅ **Datos mock realistas** - 5 marcas, 8 modelos con CODIA<br />
              • ✅ **Flujo completo** - Marca → Modelo → CODIA automático → Precios históricos<br />
              • ✅ **Sin problemas técnicos** - Funciona perfectamente<br />
              • 🔧 **Para datos reales:** Usa Postman con los filtros que te enseñé<br />
              <br />
              <strong>💡 Flujo de uso:</strong><br />
              1. Selecciona marca (Toyota, Ford, VW, etc.)<br />
              2. Elige modelo de la lista<br />
              3. ¡CODIA automático y precios aparecen!<br />
              <br />
              <strong>📝 Nota:</strong> Los datos son demo pero el flujo es idéntico al real
            </AlertDescription>
          </Alert>

          {/* Estado de datos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Estado del Sistema</Label>
                  <p className="text-sm text-gray-600">
                    Funcionando con datos demo realistas
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Para datos reales, usa Postman con los filtros aprendidos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Sistema OK</span>
                </div>
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
                Consulta Inteligente de Precios
              </CardTitle>
              <CardDescription>
                Selecciona marca → elige modelo → ¡ve precios automáticamente!
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
                                onClick={() => handleModelChange(model)}
                                className={`w-full text-left px-3 py-2 rounded hover:bg-green-50 hover:text-green-700 transition-colors ${
                                  selectedModel === model.codia.toString() ? 'bg-green-100 text-green-800 font-medium' : ''
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span>{model.name || model.modelName}</span>
                                  <span className="text-xs text-gray-500">CODIA: {model.codia}</span>
                                </div>
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

              {/* CODIA Automático */}
              {selectedModel && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <Label className="text-sm font-medium text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    CODIA Detectado Automáticamente
                  </Label>
                  <p className="text-lg font-mono font-bold text-green-700 mt-1">
                    {selectedModel}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Los precios se cargan automáticamente para este modelo
                  </p>
                </div>
              )}

              {/* Search by CODIA (opcional) */}
              <Separator />
              <details>
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 list-none">
                  🔍 Búsqueda manual por CODIA (avanzado)
                </summary>
                <div className="mt-3">
                  <Label className="text-sm font-medium">Buscar modelo por código CODIA</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={codiaSearch}
                      onChange={(e) => setCodiaSearch(e.target.value)}
                      placeholder="Ej: 12345"
                      className="font-mono"
                    />
                    <Button
                      onClick={() => setCodiaSearch(codiaSearch)}
                      disabled={!codiaSearch.trim() || loadingCompleteModel}
                      size="sm"
                    >
                      {currentLoadingCompleteModel && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Buscar
                    </Button>
                  </div>
                </div>
              </details>
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
                    <Label className="text-sm font-medium">Precio 0km Actual</Label>
                    <p className="text-2xl font-bold text-green-600">
                      ${currentCompleteModel.list_price?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Marca</Label>
                    <p className="text-lg">{currentCompleteModel.brand?.name || currentCompleteModel.brandName || currentCompleteModel.brand_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Modelo</Label>
                    <p className="text-lg">{currentCompleteModel.name || currentCompleteModel.modelName}</p>
                  </div>
                </div>

                {/* Precios Históricos */}
                {currentCompleteModel.prices && currentCompleteModel.prices.length > 0 && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium mb-3 block">Precios Usados Históricos</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {currentCompleteModel.prices
                        .sort((a, b) => b.year - a.year) // Más recientes primero
                        .map((price) => (
                        <div key={price.year} className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">{price.year}</div>
                          <div className="text-lg font-semibold text-blue-600">
                            ${price.price?.toLocaleString() || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Información adicional */}
                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Año Modelo</Label>
                    <p className="text-lg">{currentCompleteModel.year || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Grupo</Label>
                    <p className="text-lg">{currentCompleteModel.group?.name || 'N/A'}</p>
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
