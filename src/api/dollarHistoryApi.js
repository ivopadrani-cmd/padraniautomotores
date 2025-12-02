// API para obtener cotizaciones históricas del dólar blue
// Simulación basada en datos realistas del dólar blue argentino

export const dollarHistoryApi = {
  // Obtener cotización histórica para una fecha específica
  async getHistoricalRate(date) {
    try {
      // Obtener cotización actual primero
      const currentRate = await this.getCurrentRate();

      // Formatear fecha
      const formattedDate = date instanceof Date ? date.toISOString().split('T')[0] : date;
      const targetDate = new Date(formattedDate);
      const today = new Date();

      // Calcular días de diferencia
      const diffTime = today.getTime() - targetDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      console.log(`📅 Calculando cotización histórica para ${formattedDate} (${diffDays} días atrás)`);

      // Si es fecha muy reciente (última semana), devolver cotización actual
      if (diffDays <= 7) {
        console.log(`✅ Fecha reciente: usando cotización actual $${currentRate}`);
        return currentRate;
      }

      // Calcular variación histórica aproximada
      // El dólar blue ha tenido variaciones de ~2-3% mensual en los últimos años
      // Usamos una aproximación conservadora
      let estimatedRate = currentRate;
      const monthsBack = Math.floor(diffDays / 30);

      if (monthsBack > 0) {
        // Aplicar devaluación aproximada del 2.5% por mes
        const devaluationFactor = Math.pow(0.975, monthsBack);
        estimatedRate = currentRate / devaluationFactor;

        // Añadir algo de variabilidad aleatoria realista (±5%)
        const variability = 0.05;
        const randomFactor = 1 + (Math.random() - 0.5) * variability;
        estimatedRate = estimatedRate * randomFactor;
      }

      // Redondear a 2 decimales
      const finalRate = Math.round(estimatedRate * 100) / 100;

      console.log(`📊 Cotización histórica calculada: $${finalRate} (basado en $${currentRate} actual, ${monthsBack} meses atrás)`);
      return finalRate;

    } catch (error) {
      console.error('❌ Error calculando cotización histórica:', error);
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
