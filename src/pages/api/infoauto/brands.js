// API Route: GET /api/infoauto/brands
// Proxy para InfoAuto - obtiene lista de marcas

import https from 'https';

// Configuración InfoAuto
const INFOAUTO_BASE = 'https://demo.api.infoauto.com.ar/cars';
const USERNAME = 'ivopadrani@gmail.com';
const PASSWORD = 'padrani.API2025';

// Cache de tokens
let accessToken = null;
let tokenExpiry = null;

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PadraniAutomotores-API/1.0',
        ...options.headers
      },
      ...options
    };

    // Agregar Bearer token si existe
    if (accessToken && !url.includes('/auth/login')) {
      requestOptions.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function authenticate() {
  const authString = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

  const response = await makeRequest(`${INFOAUTO_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`
    }
  });

  if (response.status === 200 && response.data.access_token) {
    accessToken = response.data.access_token;
    // Token válido por 1 hora, guardamos expiry para 55 minutos
    tokenExpiry = Date.now() + (55 * 60 * 1000);
    return true;
  }

  return false;
}

async function ensureValidToken() {
  // Si no hay token o está por expirar (menos de 5 minutos), renovar
  if (!accessToken || !tokenExpiry || Date.now() > (tokenExpiry - 5 * 60 * 1000)) {
    console.log('🔄 Token expirado o inválido, renovando...');
    return await authenticate();
  }
  return true;
}

export default async function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Asegurar que tenemos un token válido
    const tokenValid = await ensureValidToken();
    if (!tokenValid) {
      return res.status(500).json({ error: 'No se pudo autenticar con InfoAuto' });
    }

    // Hacer la consulta a InfoAuto
    const infoautoResponse = await makeRequest(`${INFOAUTO_BASE}/brands/`);

    if (infoautoResponse.status === 200) {
      // Devolver los datos al frontend
      res.status(200).json({
        success: true,
        data: infoautoResponse.data,
        source: 'InfoAuto API via proxy'
      });
    } else {
      res.status(infoautoResponse.status).json({
        error: 'Error en InfoAuto API',
        details: infoautoResponse.data
      });
    }

  } catch (error) {
    console.error('Error en API route:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
