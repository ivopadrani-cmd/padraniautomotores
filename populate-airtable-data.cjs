// Script para poblar datos de ejemplo en Airtable
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

// Datos de ejemplo completos
const sampleData = {
  users: [
    {
      "fields": {
        "Email": "gerente@padrani.com",
        "Full Name": "Ivo Padrani",
        "Role": "Gerente",
        "Phone": "+5491123456789",
        "Active": true
      }
    },
    {
      "fields": {
        "Email": "vendedor1@padrani.com",
        "Full Name": "Carlos Vendedor",
        "Role": "Vendedor",
        "Phone": "+5491187654321",
        "Active": true
      }
    },
    {
      "fields": {
        "Email": "mecanico1@padrani.com",
        "Full Name": "Roberto Mecánico",
        "Role": "Mecánico",
        "Phone": "+5491155566677",
        "Active": true
      }
    }
  ],

  clients: [
    {
      "fields": {
        "Full Name": "Juan Carlos Pérez",
        "Phone": "+5491123456789",
        "Email": "juan.perez@email.com",
        "DNI": "12345678",
        "CUIT/CUIL": "20123456789",
        "Address": "Av. Corrientes 1234",
        "City": "Buenos Aires",
        "Province": "Buenos Aires",
        "Client Status": "Cliente"
      }
    },
    {
      "fields": {
        "Full Name": "María González",
        "Phone": "+5491187654321",
        "Email": "maria.gonzalez@email.com",
        "DNI": "87654321",
        "CUIT/CUIL": "20876543219",
        "Address": "Calle Florida 567",
        "City": "Buenos Aires",
        "Province": "Buenos Aires",
        "Client Status": "Cliente"
      }
    },
    {
      "fields": {
        "Full Name": "Carlos Rodríguez",
        "Phone": "+5491155566677",
        "Email": "carlos.rodriguez@email.com",
        "DNI": "11223344",
        "CUIT/CUIL": "20112233449",
        "Address": "Av. 9 de Julio 890",
        "City": "Buenos Aires",
        "Province": "Buenos Aires",
        "Client Status": "Cliente"
      }
    }
  ],

  exchangeRates: [
    {
      "fields": {
        "Rate Date": "2024-12-19",
        "Rate Type": "Diaria",
        "USD Rate": 1200,
        "Source": "DolarAPI"
      }
    }
  ],

  vehicles: [
    {
      "fields": {
        "Brand": "FORD",
        "Model": "FIESTA",
        "Year": 2020,
        "Vehicle Type": "SEDÁN",
        "Plate": "ABC123",
        "Color": "BLANCO",
        "Kilometers": 45000,
        "Registration City": "BUENOS AIRES",
        "Registration Province": "Buenos Aires",
        "Ownership": "CONSIGNACIÓN",
        "Is Consignment": true,
        "Entry Date": "2024-01-15",
        "Cost Value": 85000,
        "Cost Currency": "USD",
        "Cost Exchange Rate": 1100,
        "Target Price Value": 140000,
        "Public Price Value": 160000,
        "InfoAuto Value": 145000,
        "InfoAuto Exchange Rate": 1050,
        "InfoAuto Date": "2024-01-15",
        "Status": "DISPONIBLE",
        "Manuals": true,
        "Spare Key": true,
        "Spare Tire": true,
        "Jack": true,
        "Security Nut": true,
        "Fire Extinguisher": true
      }
    },
    {
      "fields": {
        "Brand": "TOYOTA",
        "Model": "COROLLA",
        "Year": 2021,
        "Vehicle Type": "SEDÁN",
        "Plate": "JKL012",
        "Color": "AZUL",
        "Kilometers": 25000,
        "Registration City": "BUENOS AIRES",
        "Registration Province": "Buenos Aires",
        "Ownership": "100I",
        "Entry Date": "2024-01-10",
        "Cost Value": 120000,
        "Cost Currency": "USD",
        "Cost Exchange Rate": 1180,
        "Target Price Value": 180000,
        "Public Price Value": 195000,
        "InfoAuto Value": 185000,
        "InfoAuto Exchange Rate": 1150,
        "InfoAuto Date": "2024-01-10",
        "Status": "RESERVADO",
        "Manuals": true,
        "Spare Key": true,
        "Spare Tire": true,
        "Jack": true,
        "Security Nut": true,
        "Fire Extinguisher": true
      }
    },
    {
      "fields": {
        "Brand": "VOLKSWAGEN",
        "Model": "GOLF",
        "Year": 2019,
        "Vehicle Type": "HATCHBACK",
        "Plate": "MNO345",
        "Color": "ROJO",
        "Kilometers": 55000,
        "Registration City": "BUENOS AIRES",
        "Registration Province": "Buenos Aires",
        "Ownership": "100",
        "Entry Date": "2024-01-05",
        "Cost Value": 95000,
        "Cost Currency": "USD",
        "Cost Exchange Rate": 1120,
        "Target Price Value": 155000,
        "Public Price Value": 170000,
        "Status": "VENDIDO",
        "Manuals": true,
        "Spare Key": true,
        "Spare Tire": true,
        "Jack": true,
        "Security Nut": true,
        "Fire Extinguisher": true
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
  console.log('🚀 INICIANDO POBLAMIENTO DE DATOS EN AIRTABLE\n');

  // Verificar configuración
  if (AIRTABLE_API_KEY === 'YOUR_API_KEY_HERE' || AIRTABLE_BASE_ID === 'YOUR_BASE_ID_HERE') {
    console.log('❌ CONFIGURACIÓN INCOMPLETA');
    console.log('📝 Debes configurar las variables de entorno:');
    console.log('   AIRTABLE_API_KEY=tu_api_key_aqui');
    console.log('   AIRTABLE_BASE_ID=tu_base_id_aqui');
    console.log('');
    console.log('🎯 OBTENER API KEY:');
    console.log('   1. Ir a https://airtable.com/developers/web/api/introduction');
    console.log('   2. Crear un token de acceso personal');
    console.log('   3. Copiar el token generado');
    console.log('');
    console.log('🎯 OBTENER BASE ID:');
    console.log('   1. Abrir tu base en Airtable');
    console.log('   2. Copiar el ID de la URL (después de /bases/)');
    return;
  }

  const tables = [
    { name: 'ExchangeRates', data: sampleData.exchangeRates },
    { name: 'Users', data: sampleData.users },
    { name: 'Clients', data: sampleData.clients },
    { name: 'Vehicles', data: sampleData.vehicles }
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
  console.log('2. Crear algunas ventas y reservas manualmente para probar relaciones');
  console.log('3. Configurar las automatizaciones sugeridas');
  console.log('4. Personalizar vistas según necesidades específicas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  populateAllData().catch(console.error);
}

module.exports = { populateAllData, populateTable };