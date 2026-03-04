// Script para poblar datos de ejemplo en el sistema Padrani en español
// Requiere API Key de Airtable y Base ID

const fs = require('fs');
const path = require('path');

// Configuración - CAMBIAR ESTOS VALORES
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'YOUR_API_KEY_HERE';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'YOUR_BASE_ID_HERE';

const BASE_URL = 'https://api.airtable.com/v1';

// Función para hacer requests a Airtable
async function airtableRequest(endpoint, method = 'GET', data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
  };

  const config = {
    method,
    headers
  };

  if (data && (method === 'POST' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(`Airtable API Error: ${response.status} - ${result.error?.message || 'Unknown error'}`);
  }

  return result;
}

// Datos de ejemplo en español
const sampleData = {
  cotizaciones: [
    {
      "fields": {
        "Fecha": "2024-12-19",
        "Tipo": "Diaria",
        "Valor_ARS": 1200,
        "Fuente": "DolarAPI",
        "Activa": true
      }
    }
  ],

  clientes: [
    {
      "fields": {
        "Nombre_Completo": "Juan Carlos Pérez",
        "Tipo_Cliente": "Comprador",
        "DNI": "12345678",
        "CUIT_CUIL": "20123456789",
        "Telefono": "+5491123456789",
        "Email": "juan.perez@email.com",
        "Domicilio": "Av. Corrientes 1234",
        "Localidad": "Buenos Aires",
        "Provincia": "Buenos Aires",
        "Estado_Civil": "Casado/a",
        "Observaciones": "Cliente frecuente, interesado en vehículos familiares"
      }
    },
    {
      "fields": {
        "Nombre_Completo": "María González",
        "Tipo_Cliente": "Proveedor",
        "DNI": "87654321",
        "CUIT_CUIL": "20876543219",
        "Telefono": "+5491187654321",
        "Email": "maria.gonzalez@email.com",
        "Domicilio": "Calle Florida 567",
        "Localidad": "Buenos Aires",
        "Provincia": "Buenos Aires",
        "Observaciones": "Proveedor confiable de consignaciones"
      }
    },
    {
      "fields": {
        "Nombre_Completo": "Carlos Rodríguez",
        "Tipo_Cliente": "Interesado",
        "DNI": "11223344",
        "CUIT_CUIL": "20112233449",
        "Telefono": "+5491155566677",
        "Email": "carlos.rodriguez@email.com",
        "Domicilio": "Av. 9 de Julio 890",
        "Localidad": "Buenos Aires",
        "Provincia": "Buenos Aires",
        "Observaciones": "Busca SUV familiar, presupuesto hasta $200.000"
      }
    },
    {
      "fields": {
        "Nombre_Completo": "Ana López",
        "Tipo_Cliente": "Comprador",
        "DNI": "44332211",
        "CUIT_CUIL": "20443322119",
        "Telefono": "+5491144332211",
        "Email": "ana.lopez@email.com",
        "Domicilio": "Calle Lavalle 234",
        "Localidad": "Buenos Aires",
        "Provincia": "Buenos Aires",
        "Estado_Civil": "Soltero/a"
      }
    }
  ],

  vehiculos: [
    {
      "fields": {
        "Marca": "FORD",
        "Modelo": "FIESTA",
        "Anio": 2020,
        "Tipo_Vehiculo": "SEDÁN",
        "Patente": "ABC123",
        "Color": "BLANCO",
        "Kilometraje": 45000,
        "Ciudad_Radicacion": "BUENOS AIRES",
        "Provincia_Radicacion": "Buenos Aires",
        "Propiedad": "CONSIGNACIÓN",
        "Estado": "DISPONIBLE",
        "Fecha_Ingreso": "2024-01-15",
        "Ubicacion": "PLAYA",

        // Sistema monetario
        "Costo_Valor": 85000,
        "Costo_Moneda": "USD",
        "Costo_Cotizacion": 1100,
        "InfoAuto_Precio": 145000,
        "InfoAuto_Cotizacion": 1050,
        "InfoAuto_Fecha": "2024-01-15",
        "Objetivo_Valor": 140000,
        "Objetivo_Moneda": "USD",
        "Publico_Valor": 160000,
        "Publico_Moneda": "ARS",

        // Checklist documentación
        "Cedula_Verde": true,
        "Titulo_Propiedad": true,
        "Cedula_Azul": true,
        "Factura_Compra": true,
        "Formulario_08": true,
        "Formulario_12": true,

        // Checklist accesorios
        "Manuales": true,
        "Llave_Repuesto": true,
        "Rueda_Repuesto": true,
        "Gato": true,
        "Tuerca_Seguridad": true,
        "Extintor": true,
        "Triangulo_Seguridad": true,
        "Caballete": true
      }
    },
    {
      "fields": {
        "Marca": "TOYOTA",
        "Modelo": "COROLLA",
        "Anio": 2021,
        "Tipo_Vehiculo": "SEDÁN",
        "Patente": "JKL012",
        "Color": "AZUL",
        "Kilometraje": 25000,
        "Ciudad_Radicacion": "BUENOS AIRES",
        "Provincia_Radicacion": "Buenos Aires",
        "Propiedad": "100% PROPIO",
        "Estado": "RESERVADO",
        "Fecha_Ingreso": "2024-01-10",
        "Ubicacion": "SALÓN",

        // Sistema monetario
        "Costo_Valor": 120000,
        "Costo_Moneda": "USD",
        "Costo_Cotizacion": 1180,
        "InfoAuto_Precio": 185000,
        "InfoAuto_Cotizacion": 1150,
        "InfoAuto_Fecha": "2024-01-10",
        "Objetivo_Valor": 180000,
        "Objetivo_Moneda": "ARS",
        "Publico_Valor": 195000,
        "Publico_Moneda": "ARS",

        // Checklist documentación
        "Cedula_Verde": true,
        "Titulo_Propiedad": true,
        "Cedula_Azul": true,
        "Factura_Compra": true,
        "Formulario_08": true,
        "Formulario_12": true,

        // Checklist accesorios
        "Manuales": true,
        "Llave_Repuesto": true,
        "Rueda_Repuesto": true,
        "Gato": true,
        "Tuerca_Seguridad": true,
        "Extintor": true,
        "Triangulo_Seguridad": true,
        "Caballete": true,

        // Información de reserva
        "Reservado": true,
        "Fecha_Reserva": "2024-12-15",
        "Precio_Reservado": 195000,
        "Seña_Reserva": 20000
      }
    },
    {
      "fields": {
        "Marca": "VOLKSWAGEN",
        "Modelo": "GOLF",
        "Anio": 2019,
        "Tipo_Vehiculo": "HATCHBACK",
        "Patente": "MNO345",
        "Color": "ROJO",
        "Kilometraje": 55000,
        "Ciudad_Radicacion": "BUENOS AIRES",
        "Provincia_Radicacion": "Buenos Aires",
        "Propiedad": "100% PROPIO",
        "Estado": "VENDIDO",
        "Fecha_Ingreso": "2024-01-05",
        "Ubicacion": "PLAYA",

        // Sistema monetario
        "Costo_Valor": 95000,
        "Costo_Moneda": "USD",
        "Costo_Cotizacion": 1120,
        "InfoAuto_Precio": 170000,
        "InfoAuto_Cotizacion": 1080,
        "InfoAuto_Fecha": "2024-01-05",
        "Objetivo_Valor": 155000,
        "Objetivo_Moneda": "ARS",
        "Publico_Valor": 170000,
        "Publico_Moneda": "ARS",

        // Checklist documentación
        "Cedula_Verde": true,
        "Titulo_Propiedad": true,
        "Cedula_Azul": true,
        "Factura_Compra": true,
        "Formulario_08": true,
        "Formulario_12": true,

        // Checklist accesorios
        "Manuales": true,
        "Llave_Repuesto": true,
        "Rueda_Repuesto": true,
        "Gato": true,
        "Tuerca_Seguridad": true,
        "Extintor": true,
        "Triangulo_Seguridad": true,
        "Caballete": true,

        // Información de venta
        "Venta_Realizada": true,
        "Fecha_Venta": "2024-12-10",
        "Precio_Venta_ARS": 170000,
        "Precio_Venta_Moneda": "ARS"
      }
    },
    {
      "fields": {
        "Marca": "RENAULT",
        "Modelo": "SANDERO",
        "Anio": 2019,
        "Tipo_Vehiculo": "HATCHBACK",
        "Patente": "DEF456",
        "Color": "GRIS",
        "Kilometraje": 65000,
        "Ciudad_Radicacion": "BUENOS AIRES",
        "Provincia_Radicacion": "Buenos Aires",
        "Propiedad": "CONSIGNACIÓN",
        "Estado": "A PERITAR",
        "Fecha_Ingreso": "2024-12-18",
        "Ubicacion": "PLAYA",

        // Sistema monetario
        "Costo_Valor": 75000,
        "Costo_Moneda": "USD",
        "Costo_Cotizacion": 1000,
        "Objetivo_Valor": 120000,
        "Objetivo_Moneda": "ARS",
        "Publico_Valor": 135000,
        "Publico_Moneda": "ARS",

        // Checklist parcial
        "Cedula_Verde": true,
        "Titulo_Propiedad": false,
        "Cedula_Azul": true,
        "Factura_Compra": false,
        "Formulario_08": false,
        "Formulario_12": false,

        "Manuales": true,
        "Llave_Repuesto": true,
        "Rueda_Repuesto": false,
        "Gato": true,
        "Tuerca_Seguridad": false,
        "Extintor": true,
        "Triangulo_Seguridad": true,
        "Caballete": false
      }
    }
  ]
};

// Función para poblar tabla
async function populateTable(tableName, records) {
  console.log(`📝 Poblando tabla: ${tableName} (${records.length} registros)`);

  try {
    const result = await airtableRequest(`/${AIRTABLE_BASE_ID}/${tableName}`, 'POST', {
      records: records
    });

    console.log(`✅ ${tableName}: ${result.records.length} registros creados`);
    return result.records;
  } catch (error) {
    console.error(`❌ Error en ${tableName}:`, error.message);
    return [];
  }
}

// Función principal
async function populateAllData() {
  console.log('🇦🇷 INICIANDO POBLAMIENTO DE DATOS EN SISTEMA PADRANI ESPAÑOL\n');

  // Verificar configuración
  if (AIRTABLE_API_KEY === 'YOUR_API_KEY_HERE' || AIRTABLE_BASE_ID === 'YOUR_BASE_ID_HERE') {
    console.log('❌ CONFIGURACIÓN INCOMPLETA');
    console.log('📝 Debes configurar las variables de entorno:');
    console.log('   AIRTABLE_API_KEY=tu_token_aqui');
    console.log('   AIRTABLE_BASE_ID=tu_base_id_aqui');
    console.log('');
    console.log('🎯 OBTENER API KEY:');
    console.log('   1. Ir a https://airtable.com/developers/web/api/introduction');
    console.log('   2. Crear un token de acceso personal');
    console.log('   3. Dar nombre: "Padrani Automotores Español"');
    console.log('   4. Seleccionar scopes: data.records:read, data.records:write, schema.bases:read');
    console.log('   5. Copiar el token generado');
    console.log('');
    console.log('🎯 OBTENER BASE ID:');
    console.log('   1. Abrir tu base en Airtable');
    console.log('   2. Copiar el ID de la URL (después de /bases/)');
    return;
  }

  const tables = [
    { name: 'Cotizaciones_Dolar', data: sampleData.cotizaciones },
    { name: 'Clientes', data: sampleData.clientes },
    { name: 'Vehiculos', data: sampleData.vehiculos }
  ];

  const results = {};

  for (const table of tables) {
    results[table.name] = await populateTable(table.name, table.data);
    // Pequeña pausa para evitar rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 POBLAMIENTO COMPLETADO');
  console.log('📊 RESUMEN:');
  Object.entries(results).forEach(([table, records]) => {
    console.log(`   ${table}: ${records.length} registros`);
  });

  console.log('\n💡 PRÓXIMOS PASOS:');
  console.log('1. Verificar que los datos se crearon correctamente en Airtable');
  console.log('2. Abrir la vista "Stock Principal" para ver el inventario');
  console.log('3. Probar crear una nueva consulta desde un vehículo');
  console.log('4. Configurar las automatizaciones sugeridas');
  console.log('5. Personalizar vistas según necesidades específicas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  populateAllData().catch(console.error);
}

module.exports = { populateAllData, populateTable };