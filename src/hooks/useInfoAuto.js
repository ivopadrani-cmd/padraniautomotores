import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { infoautoAPI } from '../services/infoautoApi';
import { toast } from 'sonner';

// Hook para gestionar la API Key
export function useInfoAutoApiKey() {
  const queryClient = useQueryClient();

  const setApiKey = async (apiKey) => {
    infoautoAPI.setApiKey(apiKey);
    queryClient.invalidateQueries({ queryKey: ['infoauto'] });

    // Inicializar integración automática si hay API key
    if (apiKey) {
      try {
        const { initializeInfoAutoIntegration } = await import('../services/infoAutoIntegration');
        initializeInfoAutoIntegration();
        toast.success('API Key configurada correctamente - Integración automática iniciada');
      } catch (error) {
        console.error('Error initializing integration:', error);
        toast.success('API Key configurada correctamente');
      }
    } else {
      toast.success('API Key configurada correctamente');
    }
  };

  const getApiKey = () => {
    return infoautoAPI.getApiKey();
  };

  return { setApiKey, getApiKey };
}

// Hook para probar conexión
export function useTestConnection() {
  return useQuery({
    queryKey: ['infoauto', 'connection'],
    queryFn: () => infoautoAPI.testConnection(),
    enabled: !!infoautoAPI.getApiKey(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para obtener fecha de última actualización
export function useLastUpdate() {
  return useQuery({
    queryKey: ['infoauto', 'lastUpdate'],
    queryFn: () => infoautoAPI.getLastUpdate(),
    enabled: !!infoautoAPI.getApiKey(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para obtener año actual
export function useCurrentYear() {
  return useQuery({
    queryKey: ['infoauto', 'currentYear'],
    queryFn: () => infoautoAPI.getCurrentYear(),
    enabled: !!infoautoAPI.getApiKey(),
    staleTime: 60 * 60 * 1000, // 1 hora
  });
}

// Hook para obtener marcas
export function useBrands(params = {}) {
  return useQuery({
    queryKey: ['infoauto', 'brands', params],
    queryFn: () => infoautoAPI.getBrands(params),
    enabled: !!infoautoAPI.getApiKey(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
}

// Hook para obtener todas las marcas con grupos
export function useAllBrandsWithGroups() {
  return useQuery({
    queryKey: ['infoauto', 'brandsWithGroups'],
    queryFn: () => infoautoAPI.getAllBrandsWithGroups(),
    enabled: !!infoautoAPI.getApiKey(),
    staleTime: 60 * 60 * 1000, // 1 hora
  });
}

// Hook para obtener modelos por marca
export function useModelsByBrand(brandId, params = {}) {
  return useQuery({
    queryKey: ['infoauto', 'models', brandId, params],
    queryFn: () => infoautoAPI.getModelsByBrand(brandId, params),
    enabled: !!infoautoAPI.getApiKey() && !!brandId,
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
}

// Hook para obtener grupos por marca
export function useGroupsByBrand(brandId) {
  return useQuery({
    queryKey: ['infoauto', 'groups', brandId],
    queryFn: () => infoautoAPI.getGroupsByBrand(brandId),
    enabled: !!infoautoAPI.getApiKey() && !!brandId,
    staleTime: 60 * 60 * 1000, // 1 hora
  });
}

// Hook para obtener años con precios por marca
export function usePriceYearsByBrand(brandId) {
  return useQuery({
    queryKey: ['infoauto', 'priceYears', brandId],
    queryFn: () => infoautoAPI.getPriceYearsByBrand(brandId),
    enabled: !!infoautoAPI.getApiKey() && !!brandId,
    staleTime: 60 * 60 * 1000, // 1 hora
  });
}

// Hook para obtener modelo por CODIA
export function useModelByCodia(codia) {
  return useQuery({
    queryKey: ['infoauto', 'model', codia],
    queryFn: () => infoautoAPI.getModelByCodia(codia),
    enabled: !!infoautoAPI.getApiKey() && !!codia,
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
}

// Hook para obtener precio 0km por CODIA
export function useListPriceByCodia(codia) {
  return useQuery({
    queryKey: ['infoauto', 'listPrice', codia],
    queryFn: () => infoautoAPI.getListPriceByCodia(codia),
    enabled: !!infoautoAPI.getApiKey() && !!codia,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para obtener precios usados por CODIA y año
export function useUsedPricesByCodiaAndYear(codia, year) {
  return useQuery({
    queryKey: ['infoauto', 'usedPrices', codia, year],
    queryFn: () => infoautoAPI.getUsedPricesByCodiaAndYear(codia, year),
    enabled: !!infoautoAPI.getApiKey() && !!codia && !!year,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para buscar marcas
export function useSearchBrands(searchTerm) {
  return useQuery({
    queryKey: ['infoauto', 'searchBrands', searchTerm],
    queryFn: () => infoautoAPI.searchBrands(searchTerm),
    enabled: !!infoautoAPI.getApiKey() && !!searchTerm && searchTerm.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para obtener información completa de modelo
export function useCompleteModelInfo(codia) {
  return useQuery({
    queryKey: ['infoauto', 'completeModel', codia],
    queryFn: () => infoautoAPI.getCompleteModelInfo(codia),
    enabled: !!infoautoAPI.getApiKey() && !!codia,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Mutación para actualizar precio InfoAuto de un vehículo
export function useUpdateVehicleInfoAutoPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vehicleId, codia, newPrice }) => {
      // Aquí iría la lógica para actualizar el precio en la base de datos
      // Por ahora solo simulamos la actualización
      console.log('Actualizando precio InfoAuto:', { vehicleId, codia, newPrice });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });

      return { success: true, vehicleId, codia, newPrice };
    },
    onSuccess: () => {
      toast.success('Precio InfoAuto actualizado correctamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar precio InfoAuto: ' + error.message);
    }
  });
}

// Hook para estadísticas de integración
export function useIntegrationStats() {
  return useQuery({
    queryKey: ['infoauto', 'integrationStats'],
    queryFn: () => import('../services/infoAutoIntegration').then(m => m.infoAutoIntegration.getIntegrationStats()),
    enabled: !!infoautoAPI.getApiKey(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para verificar si hay actualizaciones disponibles
export function useCheckForUpdates() {
  const { data: lastUpdate } = useLastUpdate();

  return useQuery({
    queryKey: ['infoauto', 'updates', lastUpdate],
    queryFn: async () => {
      // Aquí iría la lógica para comparar con la última actualización guardada
      // Por ahora devolvemos un estado simulado
      return {
        hasUpdates: false,
        lastCheck: new Date().toISOString(),
        message: 'No hay actualizaciones disponibles'
      };
    },
    enabled: !!lastUpdate,
    staleTime: 60 * 60 * 1000, // 1 hora
  });
}

// Hook para controlar el servicio de integración automática
export function useAutoIntegration() {
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const { infoAutoIntegration } = await import('../services/infoAutoIntegration');
        const status = infoAutoIntegration.getStatus();
        setIsRunning(status.isRunning);
      } catch (error) {
        console.error('Error checking integration status:', error);
      }
    };

    checkStatus();
  }, []);

  const startIntegration = async () => {
    try {
      const { infoAutoIntegration } = await import('../services/infoAutoIntegration');
      infoAutoIntegration.startAutoUpdate();
      setIsRunning(true);
      toast.success('Integración automática iniciada');
    } catch (error) {
      toast.error('Error al iniciar integración: ' + error.message);
    }
  };

  const stopIntegration = async () => {
    try {
      const { infoAutoIntegration } = await import('../services/infoAutoIntegration');
      infoAutoIntegration.stopAutoUpdate();
      setIsRunning(false);
      toast.success('Integración automática detenida');
    } catch (error) {
      toast.error('Error al detener integración: ' + error.message);
    }
  };

  const manualUpdate = async (vehicleId) => {
    try {
      const { infoAutoIntegration } = await import('../services/infoAutoIntegration');
      await infoAutoIntegration.manualUpdate(vehicleId);
    } catch (error) {
      throw error;
    }
  };

  return {
    isRunning,
    startIntegration,
    stopIntegration,
    manualUpdate
  };
}
