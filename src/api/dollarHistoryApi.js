// API para obtener cotizaciones históricas del dólar blue
// Usando API real: https://api.argentinadatos.com/v1/cotizaciones/dolares/

export const dollarHistoryApi = {
  // Cache para almacenar datos históricos y evitar llamadas repetidas
  cache: new Map(),

  // Obtener todos los datos históricos (con cache)
  async getAllHistoricalData() {
    if (this.cache.has('allData')) {
      return this.cache.get('allData');
    }

    try {
      console.log('📡 Descargando datos históricos completos...');
      const response = await fetch('https://api.argentinadatos.com/v1/cotizaciones/dolares/');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allData = await response.json();

      // Filtrar solo datos del dólar blue y ordenar por fecha
      const blueData = allData
        .filter(item => item.casa === 'blue')
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      this.cache.set('allData', blueData);
      console.log(`✅ Datos históricos cargados: ${blueData.length} registros del dólar blue`);
      return blueData;

    } catch (error) {
      console.error('❌ Error descargando datos históricos:', error);
      return [];
    }
  },

  // Obtener cotización histórica para una fecha específica
  async getHistoricalRate(date) {
    try {
      // Formatear fecha
      const formattedDate = date instanceof Date ? date.toISOString().split('T')[0] : date;
      const targetDate = new Date(formattedDate);
      const today = new Date();

      // Si es fecha futura o muy reciente, devolver cotización actual
      if (targetDate > today) {
        console.log(`📅 Fecha futura: usando cotización actual`);
        return await this.getCurrentRate();
      }

      // Obtener datos históricos
      const historicalData = await this.getAllHistoricalData();

      if (historicalData.length === 0) {
        console.log('⚠️ No hay datos históricos disponibles, usando cotización actual');
        return await this.getCurrentRate();
      }

      // Buscar la cotización más cercana (fecha anterior o igual)
      const targetDateStr = formattedDate;

      // Primero buscar fecha exacta
      let closestEntry = historicalData.find(entry => entry.fecha === targetDateStr);

      // Si no encuentra fecha exacta, buscar la fecha más cercana anterior
      if (!closestEntry) {
        const pastEntries = historicalData.filter(entry => entry.fecha <= targetDateStr);
        if (pastEntries.length > 0) {
          closestEntry = pastEntries[pastEntries.length - 1]; // Última fecha anterior
        }
      }

      // Si aún no hay entrada, usar la más antigua disponible
      if (!closestEntry && historicalData.length > 0) {
        closestEntry = historicalData[0];
      }

      if (closestEntry) {
        const rate = closestEntry.venta; // Usar precio de venta
        const entryDate = closestEntry.fecha;
        console.log(`✅ Cotización histórica REAL encontrada: $${rate} (${entryDate})`);
        return rate;
      }

      // Fallback: cotización actual
      console.log('⚠️ No se encontró cotización histórica, usando actual');
      return await this.getCurrentRate();

    } catch (error) {
      console.error('❌ Error obteniendo cotización histórica:', error);
      return await this.getCurrentRate();
    }
  },

  // Obtener cotización actual
  async getCurrentRate() {
    try {
      const response = await fetch('https://dolarapi.com/v1/dolares/blue');
      const data = await response.json();
      return data.venta;
    } catch (error) {
      console.error('❌ Error obteniendo cotización actual:', error);
      return 1200; // Fallback realista
    }
  }
};
