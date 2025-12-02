// API para obtener cotizaciones históricas del dólar blue
// Basado en https://dolarhistorico.com/cotizacion-dolar-blue

export const dollarHistoryApi = {
  // Obtener cotización histórica para una fecha específica
  async getHistoricalRate(date) {
    try {
      // Formatear fecha como YYYY-MM-DD
      const formattedDate = date instanceof Date ? date.toISOString().split('T')[0] : date;

      // La API de dolarhistorico.com no es una API REST real, pero podemos intentar hacer scraping
      // Por ahora, devolveremos un valor simulado basado en la fecha
      // En el futuro, si tienen una API real, podemos integrarla aquí

      const response = await fetch(`https://dolarhistorico.com/cotizacion-dolar-blue`);

      if (!response.ok) {
        throw new Error('Error al obtener cotización histórica');
      }

      const html = await response.text();

      // Extraer la cotización de la fecha específica del HTML
      // Esto es un ejemplo básico - necesitaríamos un parser HTML más robusto
      const datePattern = new RegExp(`${formattedDate.replace(/-/g, '/')}.*?(\\d+,\\d+)`, 'i');
      const match = html.match(datePattern);

      if (match && match[1]) {
        // Convertir formato argentino "1.425,00" a número
        const rateString = match[1].replace(/\./g, '').replace(',', '.');
        return parseFloat(rateString);
      }

      // Si no encontramos la fecha específica, devolver null
      return null;

    } catch (error) {
      console.error('Error obteniendo cotización histórica:', error);
      return null;
    }
  },

  // Obtener cotización actual (fallback)
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
