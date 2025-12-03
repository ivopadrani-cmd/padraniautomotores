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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Key, Search, Car, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Hooks personalizados
import {
  useInfoAutoApiKey,
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
  const [apiKeyInput, setApiKeyInput] = useState('');

  // API Key management
  const { setApiKey, getApiKey } = useInfoAutoApiKey();

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

  // Initialize API key input
  useEffect(() => {
    setApiKeyInput(getApiKey());
  }, []);

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      toast.success('API Key configurada');
    }
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

  const hasApiKey = !!getApiKey();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API InfoAuto Tester</h1>
          <p className="text-gray-600 mt-2">Prueba completa de la API de InfoAuto para integración con tu concesionario</p>
        </div>
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium">
            {hasApiKey ? 'API Configurada' : 'API No Configurada'}
          </span>
          {hasApiKey && <CheckCircle className="w-5 h-5 text-green-600" />}
        </div>
      </div>

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configuración de API
          </CardTitle>
          <CardDescription>
            Ingresa tu API Key de InfoAuto para comenzar a usar la integración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleApiKeySubmit} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Ingresa tu API Key de InfoAuto"
                className="font-mono"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={!apiKeyInput.trim()}>
                Configurar API Key
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!hasApiKey && (
        <Alert>
          <AlertDescription>
            Configura tu API Key para acceder a todas las funcionalidades de InfoAuto.
          </AlertDescription>
        </Alert>
      )}

      {hasApiKey && (
        <Tabs defaultValue="connection" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="connection">Conexión</TabsTrigger>
            <TabsTrigger value="brands">Marcas</TabsTrigger>
            <TabsTrigger value="models">Modelos</TabsTrigger>
            <TabsTrigger value="codia">CODIA</TabsTrigger>
            <TabsTrigger value="prices">Precios</TabsTrigger>
            <TabsTrigger value="updates">Actualizaciones</TabsTrigger>
          </TabsList>

          {/* Connection Test Tab */}
          <TabsContent value="connection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prueba de Conexión</CardTitle>
                <CardDescription>Verifica que la API esté funcionando correctamente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => window.location.reload()}
                    disabled={testingConnection}
                  >
                    {testingConnection && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Probar Conexión
                  </Button>
                  {connectionTest && (
                    <div className="flex items-center gap-2">
                      {connectionTest.success ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-600 font-medium">Conexión exitosa</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="text-red-600 font-medium">Error de conexión</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Última actualización</Label>
                    <div className="mt-1">
                      {loadingLastUpdate ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Cargando...</span>
                        </div>
                      ) : lastUpdate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span>{formatDate(lastUpdate.datetime)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">No disponible</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Año en curso</Label>
                    <div className="mt-1">
                      {loadingCurrentYear ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Cargando...</span>
                        </div>
                      ) : currentYear ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{currentYear.year}</Badge>
                        </div>
                      ) : (
                        <span className="text-gray-500">No disponible</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Marcas Disponibles</CardTitle>
                <CardDescription>Lista de todas las marcas en la base de InfoAuto</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBrands ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="ml-2">Cargando marcas...</span>
                  </div>
                ) : brands?.results ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brands.results.map((brand) => (
                      <Card key={brand.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{brand.name}</h3>
                              <p className="text-sm text-gray-600">{brand.group_name}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBrandChange(brand.id)}
                            >
                              Ver Modelos
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No se pudieron cargar las marcas</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Modelos por Marca</CardTitle>
                <CardDescription>Selecciona una marca para ver sus modelos disponibles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Seleccionar Marca</Label>
                  <Select value={selectedBrand} onValueChange={handleBrandChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands?.results?.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBrand && (
                  <div>
                    {loadingModels ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="ml-2">Cargando modelos...</span>
                      </div>
                    ) : models?.results ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {models.results.map((model) => (
                          <Card key={model.codia}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold">{model.name}</h3>
                                  <p className="text-sm text-gray-600">CODIA: {model.codia}</p>
                                  <p className="text-sm text-gray-600">Año: {model.year}</p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => setCodiaSearch(model.codia)}
                                >
                                  Ver Detalles
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No se encontraron modelos para esta marca</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CODIA Search Tab */}
          <TabsContent value="codia" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Búsqueda por CODIA</CardTitle>
                <CardDescription>Ingresa un CODIA para obtener información completa del modelo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="codia">CODIA</Label>
                  <div className="flex gap-2">
                    <Input
                      id="codia"
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

                {completeModel && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Car className="w-5 h-5" />
                        {completeModel.name}
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
                          <Label className="text-sm font-medium">Precio 0km</Label>
                          <p className="text-2xl font-bold text-green-600">
                            {formatPrice(completeModel.list_price.price)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Actualizado: {formatDate(completeModel.list_price.updated_at)}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={async () => {
                            if (completeModel?.codia) {
                              try {
                                await manualUpdate(completeModel.codia); // Esto debería ser el ID del vehículo, no el CODIA
                                toast.success('Precio InfoAuto actualizado');
                              } catch (error) {
                                toast.error('Error al actualizar precio');
                              }
                            }
                          }}
                          disabled={!completeModel?.codia}
                          className="flex-1"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Actualizar Precio InfoAuto
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prices Tab */}
          <TabsContent value="prices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Precios y Valores</CardTitle>
                <CardDescription>Información de precios de la API de InfoAuto</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    Esta sección mostrará información de precios 0km y usados.
                    La funcionalidad completa estará disponible próximamente.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration Tab */}
          <TabsContent value="updates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Integración Automática
                </CardTitle>
                <CardDescription>
                  Sistema de actualización automática de precios InfoAuto para optimizar procesos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Control del servicio */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Control del Servicio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Servicio de actualización automática:
                          <span className={`ml-2 px-2 py-1 rounded text-sm ${integrationRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {integrationRunning ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {integrationRunning
                            ? 'El sistema verifica actualizaciones cada 10 minutos'
                            : 'El servicio está detenido'
                          }
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!integrationRunning ? (
                          <Button onClick={startIntegration} className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Iniciar Servicio
                          </Button>
                        ) : (
                          <Button onClick={stopIntegration} variant="outline" className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            Detener Servicio
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Estadísticas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Estadísticas de Integración</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingStats ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="ml-2">Cargando estadísticas...</span>
                      </div>
                    ) : integrationStats ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded">
                          <div className="text-2xl font-bold text-blue-600">{integrationStats.totalVehicles}</div>
                          <div className="text-sm text-gray-600">Total Vehículos</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-600">{integrationStats.vehiclesWithCodia}</div>
                          <div className="text-sm text-gray-600">Con CODIA</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded">
                          <div className="text-2xl font-bold text-yellow-600">{integrationStats.coveragePercentage}%</div>
                          <div className="text-sm text-gray-600">Cobertura</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded">
                          <div className="text-2xl font-bold text-purple-600">
                            {integrationStats.lastUpdateCheck ? formatDate(integrationStats.lastUpdateCheck) : 'Nunca'}
                          </div>
                          <div className="text-sm text-gray-600">Última Verificación</div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No se pudieron cargar las estadísticas</p>
                    )}
                  </CardContent>
                </Card>

                {/* Información del sistema */}
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
                      <h3 className="font-semibold">Frecuencia de Verificación</h3>
                      <p className="text-sm text-gray-600">Cada 10 minutos</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                      <h3 className="font-semibold">Actualizaciones Automáticas</h3>
                      <p className="text-sm text-gray-600">Precios InfoAuto</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Información adicional */}
                <Alert>
                  <AlertDescription>
                    <strong>¿Cómo funciona?</strong><br />
                    1. El sistema verifica cada 10 minutos si hay actualizaciones en la API de InfoAuto<br />
                    2. Si detecta cambios, actualiza automáticamente los precios InfoAuto de todos los vehículos con CODIA<br />
                    3. Solo actualiza precios que cambiaron significativamente (&gt;1%)<br />
                    4. Los precios históricos se mantienen para referencia de costos
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
