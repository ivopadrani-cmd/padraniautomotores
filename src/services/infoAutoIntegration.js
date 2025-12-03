// InfoAuto Integration Service
// Servicio para actualizar automáticamente los precios InfoAuto de los vehículos

import { infoautoAPI } from './infoautoApi';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

class InfoAutoIntegration {
  constructor() {
    this.lastUpdateCheck = null;
    this.isRunning = false;
    this.updateInterval = 10 * 60 * 1000; // 10 minutos
  }

  // Iniciar el servicio de actualización automática
  startAutoUpdate() {
    if (this.isRunning) {
      console.log('InfoAuto Integration: Servicio ya está ejecutándose');
      return;
    }

    console.log('InfoAuto Integration: Iniciando servicio de actualización automática');
    this.isRunning = true;
    this.scheduleNextUpdate();
  }

  // Detener el servicio
  stopAutoUpdate() {
    console.log('InfoAuto Integration: Deteniendo servicio');
    this.isRunning = false;
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
  }

  // Programar la próxima actualización
  scheduleNextUpdate() {
    if (!this.isRunning) return;

    this.updateTimeout = setTimeout(() => {
      this.checkForUpdates();
    }, this.updateInterval);
  }

  // Verificar si hay actualizaciones disponibles
  async checkForUpdates() {
    if (!this.isRunning) return;

    try {
      console.log('InfoAuto Integration: Verificando actualizaciones...');

      // Obtener la última actualización de la API
      const lastUpdate = await infoautoAPI.getLastUpdate();

      if (!lastUpdate) {
        console.log('InfoAuto Integration: No se pudo obtener información de actualización');
        this.scheduleNextUpdate();
        return;
      }

      const lastUpdateTime = new Date(lastUpdate.datetime);
      const shouldUpdate = !this.lastUpdateCheck || lastUpdateTime > this.lastUpdateCheck;

      if (shouldUpdate) {
        console.log('InfoAuto Integration: Nuevas actualizaciones detectadas, iniciando actualización...');
        await this.updateAllVehiclePrices();
        this.lastUpdateCheck = lastUpdateTime;
        toast.success('Precios InfoAuto actualizados automáticamente');
      } else {
        console.log('InfoAuto Integration: No hay actualizaciones nuevas');
      }

    } catch (error) {
      console.error('InfoAuto Integration: Error al verificar actualizaciones:', error);
    }

    // Programar la próxima verificación
    this.scheduleNextUpdate();
  }

  // Actualizar precios de todos los vehículos
  async updateAllVehiclePrices() {
    try {
      console.log('InfoAuto Integration: Actualizando precios de vehículos...');

      // Obtener todos los vehículos que tienen CODIA
      const { data: vehicles, error } = await base44.entities.Vehicle.list({
        filters: {
          codia: { not: { is: null } }
        }
      });

      if (error) {
        console.error('InfoAuto Integration: Error al obtener vehículos:', error);
        return;
      }

      if (!vehicles || vehicles.length === 0) {
        console.log('InfoAuto Integration: No hay vehículos con CODIA para actualizar');
        return;
      }

      let updatedCount = 0;
      let errorCount = 0;

      // Procesar cada vehículo
      for (const vehicle of vehicles) {
        try {
          await this.updateVehiclePrice(vehicle);
          updatedCount++;
        } catch (error) {
          console.error(`InfoAuto Integration: Error al actualizar vehículo ${vehicle.id}:`, error);
          errorCount++;
        }

        // Pequeña pausa para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`InfoAuto Integration: Actualización completada. ${updatedCount} actualizados, ${errorCount} errores`);

      if (updatedCount > 0) {
        toast.success(`Se actualizaron los precios InfoAuto de ${updatedCount} vehículos`);
      }

    } catch (error) {
      console.error('InfoAuto Integration: Error en actualización masiva:', error);
      toast.error('Error al actualizar precios InfoAuto');
    }
  }

  // Actualizar precio de un vehículo específico
  async updateVehiclePrice(vehicle) {
    if (!vehicle.codia) {
      throw new Error('Vehículo sin CODIA');
    }

    try {
      // Obtener información completa del modelo desde InfoAuto
      const modelInfo = await infoautoAPI.getCompleteModelInfo(vehicle.codia);

      if (!modelInfo || !modelInfo.list_price) {
        throw new Error('No se pudo obtener precio de InfoAuto');
      }

      const newPrice = modelInfo.list_price.price;
      const currentPrice = vehicle.infoauto_value || 0;

      // Solo actualizar si el precio cambió significativamente (>1%)
      const priceDifference = Math.abs(newPrice - currentPrice) / currentPrice;
      if (priceDifference < 0.01) {
        console.log(`InfoAuto Integration: Precio de ${vehicle.brand} ${vehicle.model} sin cambios significativos`);
        return;
      }

      // Actualizar el vehículo en la base de datos
      await base44.entities.Vehicle.update(vehicle.id, {
        infoauto_value: newPrice,
        infoauto_currency: 'ARS',
        infoauto_date: new Date().toISOString().split('T')[0]
      });

      console.log(`InfoAuto Integration: Actualizado ${vehicle.brand} ${vehicle.model}: ${currentPrice} → ${newPrice}`);

    } catch (error) {
      console.error(`InfoAuto Integration: Error al actualizar precio para CODIA ${vehicle.codia}:`, error);
      throw error;
    }
  }

  // Verificar estado del servicio
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdateCheck: this.lastUpdateCheck,
      nextUpdateIn: this.updateTimeout ? Math.ceil((this.updateTimeout._idleStart + this.updateTimeout._idleTimeout - Date.now()) / 1000 / 60) : null
    };
  }

  // Actualización manual para un vehículo específico
  async manualUpdate(vehicleId) {
    try {
      const { data: vehicle, error } = await base44.entities.Vehicle.get(vehicleId);

      if (error || !vehicle) {
        throw new Error('Vehículo no encontrado');
      }

      await this.updateVehiclePrice(vehicle);
      toast.success('Precio InfoAuto actualizado manualmente');

    } catch (error) {
      console.error('InfoAuto Integration: Error en actualización manual:', error);
      toast.error('Error al actualizar precio InfoAuto: ' + error.message);
    }
  }

  // Obtener estadísticas de integración
  async getIntegrationStats() {
    try {
      // Obtener vehículos con CODIA
      const { data: vehiclesWithCodia, error: error1 } = await base44.entities.Vehicle.list({
        filters: {
          codia: { not: { is: null } }
        }
      });

      if (error1) throw error1;

      // Obtener todos los vehículos
      const { data: allVehicles, error: error2 } = await base44.entities.Vehicle.list();

      if (error2) throw error2;

      const vehiclesCount = allVehicles?.length || 0;
      const vehiclesWithCodiaCount = vehiclesWithCodia?.length || 0;
      const coveragePercentage = vehiclesCount > 0 ? (vehiclesWithCodiaCount / vehiclesCount) * 100 : 0;

      return {
        totalVehicles: vehiclesCount,
        vehiclesWithCodia: vehiclesWithCodiaCount,
        coveragePercentage: Math.round(coveragePercentage * 100) / 100,
        lastUpdateCheck: this.lastUpdateCheck,
        isRunning: this.isRunning
      };

    } catch (error) {
      console.error('InfoAuto Integration: Error al obtener estadísticas:', error);
      return {
        totalVehicles: 0,
        vehiclesWithCodia: 0,
        coveragePercentage: 0,
        lastUpdateCheck: null,
        isRunning: this.isRunning,
        error: error.message
      };
    }
  }
}

// Instancia global
export const infoAutoIntegration = new InfoAutoIntegration();

// Función para inicializar la integración (llamar en el App.jsx o Dashboard)
export function initializeInfoAutoIntegration() {
  // Solo iniciar si hay API key configurada
  if (infoautoAPI.getApiKey()) {
    infoAutoIntegration.startAutoUpdate();
  }
}

// Función para detener la integración (al cerrar la app)
export function stopInfoAutoIntegration() {
  infoAutoIntegration.stopAutoUpdate();
}

export default infoAutoIntegration;
