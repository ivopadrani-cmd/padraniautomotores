// API para obtener cotizaciones históricas del dólar blue
// Usando https://dolarhistorico.com/cotizacion-dolar-blue

export const dollarHistoryApi = {
  // Obtener cotización histórica para una fecha específica
  async getHistoricalRate(date) {
    try {
      // Formatear fecha como DD/MM/YYYY para la búsqueda
      const formattedDate = date instanceof Date ? date.toISOString().split('T')[0] : date;
      const [year, month, day] = formattedDate.split('-');
      const searchDate = `${day}/${month}/${year}`;

      console.log(`Buscando cotización histórica para: ${searchDate}`);

      // Obtener la página completa
      const response = await fetch('https://dolarhistorico.com/cotizacion-dolar-blue');
      const html = await response.text();

      // Buscar la fila que contiene la fecha específica
      // El formato es: <td>DD/MM/YYYY</td><td>compra</td><td>venta</td><td>variación</td>
      const datePattern = new RegExp(`<td>${searchDate}</td>\\s*<td[^>]*>[^<]*</td>\\s*<td[^>]*>([\\d,]+)</td>`, 'i');

      const match = html.match(datePattern);
      if (match && match[1]) {
        // Convertir formato argentino "1.425,00" a número
        const rateString = match[1].replace(/\./g, '').replace(',', '.');
        const rate = parseFloat(rateString);
        console.log(`✅ Cotización histórica encontrada para ${searchDate}: $${rate}`);
        return rate;
      }

      // Si no encuentra la fecha exacta, buscar la fecha más cercana actualizada
      console.log(`⚠️ No se encontró cotización exacta para ${searchDate}, buscando fecha más cercana actualizada...`);

      // Buscar tanto hacia atrás como hacia adelante, pero priorizando fechas más recientes
      const targetDate = new Date(formattedDate);
      const today = new Date();
      const isFutureDate = targetDate > today;

      // Si es fecha futura, buscar hacia atrás desde hoy
      // Si es fecha pasada, buscar la fecha más cercana (hacia atrás primero, luego hacia adelante si es necesario)
      const searchRange = isFutureDate ? 30 : 14; // Más amplio para fechas futuras
      const datesToCheck = [];

      if (isFutureDate) {
        // Para fechas futuras, buscar desde hoy hacia atrás
        for (let i = 0; i <= searchRange; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          datesToCheck.push(checkDate);
        }
      } else {
        // Para fechas pasadas, buscar primero hacia atrás (fechas más cercanas), luego hacia adelante
        for (let i = 1; i <= 7; i++) {
          const checkDate = new Date(targetDate);
          checkDate.setDate(targetDate.getDate() - i);
          datesToCheck.push(checkDate);
        }
        // Si no encuentra nada cercano hacia atrás, buscar un poco hacia adelante
        for (let i = 1; i <= 3; i++) {
          const checkDate = new Date(targetDate);
          checkDate.setDate(targetDate.getDate() + i);
          datesToCheck.push(checkDate);
        }
      }

      // Buscar en todas las fechas candidate
      for (const checkDate of datesToCheck) {
        const checkDay = String(checkDate.getDate()).padStart(2, '0');
        const checkMonth = String(checkDate.getMonth() + 1).padStart(2, '0');
        const checkYear = checkDate.getFullYear();
        const checkDateStr = `${checkDay}/${checkMonth}/${checkYear}`;

        const checkPattern = new RegExp(`<td>${checkDateStr}</td>\\s*<td[^>]*>[^<]*</td>\\s*<td[^>]*>([\\d,]+)</td>`, 'i');
        const checkMatch = html.match(checkPattern);

        if (checkMatch && checkMatch[1]) {
          const rateString = checkMatch[1].replace(/\./g, '').replace(',', '.');
          const rate = parseFloat(rateString);
          console.log(`✅ Cotización encontrada para fecha cercana ${checkDateStr}: $${rate}`);
          return rate;
        }
      }

      // Si no encuentra ninguna fecha cercana, devolver cotización actual
      console.log(`❌ No se encontraron cotizaciones históricas, usando cotización actual`);
      return await this.getCurrentRate();

    } catch (error) {
      console.error('❌ Error obteniendo cotización histórica:', error);
      // En caso de error, devolver cotización actual
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
      return 1200; // Fallback
    }
  }
};
