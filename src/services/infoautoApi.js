// InfoAuto API Service
// URL base de la API demo
const BASE_URL = 'https://demo.corporativo.infoauto.com.ar';

class InfoAutoAPI {
  constructor() {
    this.apiKey = localStorage.getItem('infoauto_api_key') || '';
    this.baseURL = BASE_URL;
  }

  // Configurar API Key
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    localStorage.setItem('infoauto_api_key', apiKey);
  }

  getApiKey() {
    return this.apiKey;
  }

  // Headers para las peticiones
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      // Algunos APIs usan API-Key header en lugar de Authorization
      'API-Key': this.apiKey
    };
  }

  // Método genérico para hacer peticiones
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en ${endpoint}:`, error);
      throw error;
    }
  }

  // ========== ENDPOINTS PRINCIPALES ==========

  // 1. Obtener fecha de última actualización
  async getLastUpdate() {
    return this.request('/datetime');
  }

  // 2. Obtener año en curso
  async getCurrentYear() {
    return this.request('/current_year');
  }

  // 3. Obtener marcas (paginado)
  async getBrands(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/brands/?${queryString}` : '/brands/';
    return this.request(endpoint);
  }

  // 4. Obtener todas las marcas con grupos
  async getAllBrandsWithGroups() {
    return this.request('/brands/download/');
  }

  // 5. Obtener modelos por marca
  async getModelsByBrand(brandId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/brands/${brandId}/models/?${queryString}`
      : `/brands/${brandId}/models/`;
    return this.request(endpoint);
  }

  // 6. Obtener grupos por marca
  async getGroupsByBrand(brandId) {
    return this.request(`/brands/${brandId}/groups/`);
  }

  // 7. Obtener años con precios por marca
  async getPriceYearsByBrand(brandId) {
    return this.request(`/brands/${brandId}/prices/`);
  }

  // 8. Obtener años con precios por marca y grupo
  async getPriceYearsByBrandAndGroup(brandId, groupId) {
    return this.request(`/brands/${brandId}/groups/${groupId}/prices/`);
  }

  // 9. Obtener modelos por marca y grupo
  async getModelsByBrandAndGroup(brandId, groupId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/brands/${brandId}/groups/${groupId}/models/?${queryString}`
      : `/brands/${brandId}/groups/${groupId}/models/`;
    return this.request(endpoint);
  }

  // 10. Obtener modelo por CODIA
  async getModelByCodia(codia) {
    return this.request(`/models/${codia}`);
  }

  // 11. Obtener precio 0km por CODIA
  async getListPriceByCodia(codia) {
    return this.request(`/models/${codia}/list_price`);
  }

  // 12. Obtener precios usados por CODIA y año
  async getUsedPricesByCodiaAndYear(codia, year) {
    return this.request(`/models/${codia}/used_prices/${year}`);
  }

  // ========== FUNCIONES DE UTILIDAD ==========

  // Buscar marca por nombre
  async searchBrands(searchTerm) {
    return this.getBrands({ search: searchTerm });
  }

  // Obtener modelo completo con precio por CODIA
  async getCompleteModelInfo(codia) {
    try {
      const [modelInfo, listPrice] = await Promise.all([
        this.getModelByCodia(codia),
        this.getListPriceByCodia(codia)
      ]);

      return {
        ...modelInfo,
        list_price: listPrice
      };
    } catch (error) {
      console.error('Error obteniendo información completa del modelo:', error);
      throw error;
    }
  }

  // Verificar conectividad
  async testConnection() {
    try {
      await this.getLastUpdate();
      return { success: true, message: 'Conexión exitosa' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// Instancia global
export const infoautoAPI = new InfoAutoAPI();
export default infoautoAPI;
