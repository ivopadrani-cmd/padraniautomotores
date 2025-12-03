// InfoAuto API Service
// URL base de la API demo
const BASE_URL = 'https://demo.api.infoauto.com.ar/cars';
const AUTH_URL = 'https://demo.api.infoauto.com.ar/cars/auth/login';
const REFRESH_URL = 'https://demo.api.infoauto.com.ar/cars/auth/refresh';

class InfoAutoAPI {
  constructor() {
    this.username = localStorage.getItem('infoauto_username') || '';
    this.password = localStorage.getItem('infoauto_password') || '';
    this.baseURL = BASE_URL;
    this.accessToken = localStorage.getItem('infoauto_access_token') || null;
    this.refreshToken = localStorage.getItem('infoauto_refresh_token') || null;
    this.tokenExpiry = localStorage.getItem('infoauto_token_expiry') || null;

    // Iniciar renovación automática de tokens
    this.startTokenRefresh();
  }

  // Configurar credenciales
  setCredentials(username, password) {
    this.username = username;
    this.password = password;
    localStorage.setItem('infoauto_username', username);
    localStorage.setItem('infoauto_password', password);
    // Limpiar tokens existentes para forzar nueva autenticación
    this.clearTokens();
  }

  getCredentials() {
    return {
      username: this.username,
      password: this.password
    };
  }

  // Limpiar tokens
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem('infoauto_access_token');
    localStorage.removeItem('infoauto_refresh_token');
    localStorage.removeItem('infoauto_token_expiry');
  }

  // Verificar si el token es válido
  isTokenValid() {
    if (!this.accessToken || !this.tokenExpiry) return false;
    // Dar 5 minutos de margen antes de expirar
    return Date.now() < (parseInt(this.tokenExpiry) - 5 * 60 * 1000);
  }

  // Autenticación inicial (Basic Auth)
  async authenticate() {
    if (!this.username || !this.password) {
      throw new Error('Credenciales no configuradas');
    }

    const authString = btoa(`${this.username}:${this.password}`);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.access_token && data.refresh_token) {
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        // Access token válido por 1 hora
        this.tokenExpiry = Date.now() + (55 * 60 * 1000); // 55 minutos para margen

        // Guardar en localStorage
        localStorage.setItem('infoauto_access_token', this.accessToken);
        localStorage.setItem('infoauto_refresh_token', this.refreshToken);
        localStorage.setItem('infoauto_token_expiry', this.tokenExpiry.toString());

        console.log('InfoAuto: Autenticación exitosa');
        return data;
      } else {
        throw new Error('Respuesta de autenticación inválida');
      }
    } catch (error) {
      console.error('InfoAuto: Error en autenticación:', error);
      throw error;
    }
  }

  // Renovar access token usando refresh token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No hay refresh token disponible');
    }

    try {
      const response = await fetch(REFRESH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.refreshToken}`
        }
      });

      if (!response.ok) {
        // Si refresh falla, forzar nueva autenticación
        this.clearTokens();
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.access_token) {
        this.accessToken = data.access_token;
        // Si viene nuevo refresh token, actualizarlo
        if (data.refresh_token) {
          this.refreshToken = data.refresh_token;
          localStorage.setItem('infoauto_refresh_token', this.refreshToken);
        }
        // Access token válido por 1 hora
        this.tokenExpiry = Date.now() + (55 * 60 * 1000);

        localStorage.setItem('infoauto_access_token', this.accessToken);
        localStorage.setItem('infoauto_token_expiry', this.tokenExpiry.toString());

        console.log('InfoAuto: Token renovado exitosamente');
        return data;
      } else {
        throw new Error('Respuesta de renovación inválida');
      }
    } catch (error) {
      console.error('InfoAuto: Error al renovar token:', error);
      // Forzar nueva autenticación si falla
      this.clearTokens();
      throw error;
    }
  }

  // Iniciar renovación automática de tokens
  startTokenRefresh() {
    // Verificar cada 10 minutos si el token necesita renovación
    setInterval(async () => {
      try {
        if (this.username && this.password) {
          if (!this.isTokenValid() && this.refreshToken) {
            console.log('InfoAuto: Renovando token automáticamente...');
            await this.refreshAccessToken();
          } else if (!this.accessToken) {
            console.log('InfoAuto: Obteniendo token inicial...');
            await this.authenticate();
          }
        }
      } catch (error) {
        console.error('InfoAuto: Error en renovación automática:', error);
      }
    }, 10 * 60 * 1000); // Cada 10 minutos
  }

  // Headers para las peticiones
  getHeaders() {
    if (!this.isTokenValid()) {
      throw new Error('Token inválido o expirado');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`
    };
  }

  // Método genérico para hacer peticiones con manejo automático de tokens
  async request(endpoint, options = {}, retryCount = 0) {
    const url = `${this.baseURL}${endpoint}`;

    // Asegurar que tenemos un token válido antes de hacer la petición
    if (!this.isTokenValid()) {
      if (this.refreshToken) {
        try {
          await this.refreshAccessToken();
        } catch (error) {
          // Si falla refresh, intentar autenticación completa
          try {
            await this.authenticate();
          } catch (authError) {
            throw new Error('No se pudo autenticar con InfoAuto');
          }
        }
      } else {
        // Primera vez, hacer autenticación
        try {
          await this.authenticate();
        } catch (authError) {
          throw new Error('No se pudo autenticar con InfoAuto');
        }
      }
    }

    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);

      // Si el token expiró (401), intentar renovar una vez
      if (response.status === 401 && retryCount === 0) {
        console.log('InfoAuto: Token expirado, intentando renovar...');
        try {
          await this.refreshAccessToken();
          // Reintentar la petición con el nuevo token
          return this.request(endpoint, options, retryCount + 1);
        } catch (refreshError) {
          // Si falla, intentar nueva autenticación
          try {
            await this.authenticate();
            return this.request(endpoint, options, retryCount + 1);
          } catch (authError) {
            throw new Error('Error de autenticación con InfoAuto');
          }
        }
      }

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

  // Verificar si hay credenciales configuradas
  hasCredentials() {
    return !!(this.username && this.password);
  }

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

  // Verificar conectividad y autenticación
  async testConnection() {
    try {
      if (!this.hasCredentials()) {
        return { success: false, message: 'Credenciales no configuradas' };
      }

      // Intentar autenticar si no hay token válido
      if (!this.isTokenValid()) {
        await this.authenticate();
      }

      // Probar un endpoint simple
      await this.getCurrentYear();
      return { success: true, message: 'Conexión y autenticación exitosas' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// Instancia global
export const infoautoAPI = new InfoAutoAPI();
export default infoautoAPI;
