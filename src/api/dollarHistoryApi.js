// API para obtener cotizaciones históricas del dólar blue
// Por ahora usa aproximaciones basadas en cotización actual
// TODO: Integrar API real de cotizaciones históricas cuando esté disponible

export const dollarHistoryApi = {
  // Obtener cotización histórica para una fecha específica
  async getHistoricalRate(date) {
    try {
      // Formatear fecha como YYYY-MM-DD
      const formattedDate = date instanceof Date ? date.toISOString().split('T')[0] : date;
      const targetDate = new Date(formattedDate);
      const today = new Date();

      // Calcular días de diferencia
      const diffTime = today.getTime() - targetDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Obtener cotización actual
      const currentRate = await this.getCurrentRate();

      if (!currentRate) return null;

      // Para fechas recientes (últimos 30 días), devolver cotización actual
      // Para fechas más antiguas, aplicar una aproximación basada en devaluación histórica
      if (diffDays <= 30) {
        return currentRate;
      } else if (diffDays <= 90) {
        // Aproximación: asumir devaluación del 2% por mes en promedio
        const monthsBack = Math.floor(diffDays / 30);
        const estimatedRate = currentRate / Math.pow(1.02, monthsBack);
        return Math.round(estimatedRate * 100) / 100; // Redondear a 2 decimales
      } else {
        // Para fechas muy antiguas, devolver una aproximación conservadora
        const monthsBack = Math.floor(diffDays / 30);
        const estimatedRate = currentRate / Math.pow(1.03, monthsBack);
        return Math.round(estimatedRate * 100) / 100;
      }

    } catch (error) {
      console.error('Error obteniendo cotización histórica:', error);
      return null;
    }
  },

  // Obtener cotización actual
  async getCurrentRate() {
    try {
      const response = await fetch('https://dolarapi.com/v1/dolares/blue');
      const data = await response.json();
      return data.venta;
    } catch (error) {
      console.error('Error obteniendo cotización actual:', error);
      return 1200; // Fallback
    }
  }
};
