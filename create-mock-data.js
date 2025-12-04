// Script para crear datos mock de InfoAuto basados en Swagger UI
// Ejecutar con: node create-mock-data.js

import fs from 'fs';
import path from 'path';

// Datos mock basados en estructura real de InfoAuto
const MOCK_BRANDS = [
  {
    id: 1,
    name: "Toyota",
    logo_url: "https://example.com/toyota-logo.png",
    list_price: true,
    prices: true,
    prices_from: 2015,
    prices_to: 2025,
    summary: "Marca japonesa líder en calidad y confiabilidad"
  },
  {
    id: 2,
    name: "Ford",
    logo_url: "https://example.com/ford-logo.png",
    list_price: true,
    prices: true,
    prices_from: 2010,
    prices_to: 2025,
    summary: "Marca americana con amplia gama de vehículos"
  },
  {
    id: 3,
    name: "Volkswagen",
    logo_url: "https://example.com/vw-logo.png",
    list_price: true,
    prices: true,
    prices_from: 2012,
    prices_to: 2025,
    summary: "Marca alemana con tecnología avanzada"
  },
  {
    id: 4,
    name: "Chevrolet",
    logo_url: "https://example.com/chevrolet-logo.png",
    list_price: true,
    prices: true,
    prices_from: 2010,
    prices_to: 2025,
    summary: "Marca americana accesible y popular"
  },
  {
    id: 5,
    name: "Honda",
    logo_url: "https://example.com/honda-logo.png",
    list_price: true,
    prices: true,
    prices_from: 2013,
    prices_to: 2025,
    summary: "Marca japonesa conocida por su eficiencia"
  }
];

// Modelos mock por marca
const MOCK_MODELS = {
  1: [ // Toyota
    {
      id: 101,
      codia: 12345,
      as_codia: 12345,
      brand: { id: 1, name: "Toyota" },
      group: { id: 11, name: "Corolla" },
      description: "Corolla 1.8 XEi MT",
      list_price: 18500000,
      prices: [
        { year: 2020, price: 8500000 },
        { year: 2021, price: 9200000 },
        { year: 2022, price: 10500000 },
        { year: 2023, price: 12500000 },
        { year: 2024, price: 14500000 },
        { year: 2025, price: 16500000 }
      ],
      photo_url: "https://example.com/corolla.jpg",
      position: 1,
      summary: "Sedán mediano confiable"
    },
    {
      id: 102,
      codia: 12346,
      as_codia: 12346,
      brand: { id: 1, name: "Toyota" },
      group: { id: 12, name: "Hilux" },
      description: "Hilux 2.4 CD DX 4x4 MT",
      list_price: 28500000,
      prices: [
        { year: 2020, price: 15500000 },
        { year: 2021, price: 17500000 },
        { year: 2022, price: 20500000 },
        { year: 2023, price: 23500000 },
        { year: 2024, price: 26500000 },
        { year: 2025, price: 29500000 }
      ],
      photo_url: "https://example.com/hilux.jpg",
      position: 2,
      summary: "Pickup robusta para trabajo pesado"
    },
    {
      id: 103,
      codia: 12347,
      as_codia: 12347,
      brand: { id: 1, name: "Toyota" },
      group: { id: 13, name: "RAV4" },
      description: "RAV4 2.0 TXL CVT",
      list_price: 32500000,
      prices: [
        { year: 2020, price: 18500000 },
        { year: 2021, price: 21500000 },
        { year: 2022, price: 24500000 },
        { year: 2023, price: 27500000 },
        { year: 2024, price: 30500000 },
        { year: 2025, price: 33500000 }
      ],
      photo_url: "https://example.com/rav4.jpg",
      position: 3,
      summary: "SUV compacta urbana"
    }
  ],
  2: [ // Ford
    {
      id: 201,
      codia: 22345,
      as_codia: 22345,
      brand: { id: 2, name: "Ford" },
      group: { id: 21, name: "Focus" },
      description: "Focus 1.6 S MT",
      list_price: 16500000,
      prices: [
        { year: 2020, price: 7200000 },
        { year: 2021, price: 8200000 },
        { year: 2022, price: 9500000 },
        { year: 2023, price: 11500000 },
        { year: 2024, price: 13500000 },
        { year: 2025, price: 15500000 }
      ],
      photo_url: "https://example.com/focus.jpg",
      position: 1,
      summary: "Hatchback deportivo"
    },
    {
      id: 202,
      codia: 22346,
      as_codia: 22346,
      brand: { id: 2, name: "Ford" },
      group: { id: 22, name: "Ranger" },
      description: "Ranger 2.2 XLS 4x4 MT",
      list_price: 29500000,
      prices: [
        { year: 2020, price: 16500000 },
        { year: 2021, price: 18500000 },
        { year: 2022, price: 21500000 },
        { year: 2023, price: 24500000 },
        { year: 2024, price: 27500000 },
        { year: 2025, price: 30500000 }
      ],
      photo_url: "https://example.com/ranger.jpg",
      position: 2,
      summary: "Pickup mediana versátil"
    }
  ],
  3: [ // Volkswagen
    {
      id: 301,
      codia: 32345,
      as_codia: 32345,
      brand: { id: 3, name: "Volkswagen" },
      group: { id: 31, name: "Golf" },
      description: "Golf 1.4 TSI Highline",
      list_price: 24500000,
      prices: [
        { year: 2020, price: 13500000 },
        { year: 2021, price: 15500000 },
        { year: 2022, price: 18500000 },
        { year: 2023, price: 21500000 },
        { year: 2024, price: 24500000 },
        { year: 2025, price: 27500000 }
      ],
      photo_url: "https://example.com/golf.jpg",
      position: 1,
      summary: "Hatchback premium"
    }
  ],
  4: [ // Chevrolet
    {
      id: 401,
      codia: 42345,
      as_codia: 42345,
      brand: { id: 4, name: "Chevrolet" },
      group: { id: 41, name: "Cruze" },
      description: "Cruze 1.4 LT MT",
      list_price: 19500000,
      prices: [
        { year: 2020, price: 9500000 },
        { year: 2021, price: 11500000 },
        { year: 2022, price: 13500000 },
        { year: 2023, price: 15500000 },
        { year: 2024, price: 17500000 },
        { year: 2025, price: 19500000 }
      ],
      photo_url: "https://example.com/cruze.jpg",
      position: 1,
      summary: "Sedán espacioso y cómodo"
    }
  ],
  5: [ // Honda
    {
      id: 501,
      codia: 52345,
      as_codia: 52345,
      brand: { id: 5, name: "Honda" },
      group: { id: 51, name: "Civic" },
      description: "Civic 2.0 EX CVT",
      list_price: 26500000,
      prices: [
        { year: 2020, price: 14500000 },
        { year: 2021, price: 16500000 },
        { year: 2022, price: 19500000 },
        { year: 2023, price: 22500000 },
        { year: 2024, price: 25500000 },
        { year: 2025, price: 28500000 }
      ],
      photo_url: "https://example.com/civic.jpg",
      position: 1,
      summary: "Sedán deportivo y eficiente"
    }
  ]
};

// Función principal
function createMockData() {
  console.log('🎭 Creando datos mock de InfoAuto...\n');

  // Crear directorio si no existe
  const outputDir = 'public/data/infoauto';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Crear archivo de marcas
  console.log('📄 Creando marcas...');
  fs.writeFileSync(
    path.join(outputDir, 'brands.json'),
    JSON.stringify(MOCK_BRANDS, null, 2)
  );

  // 2. Crear archivo con todas las marcas y sus grupos
  const brandsWithGroups = MOCK_BRANDS.map(brand => ({
    ...brand,
    groups: [] // En mock no incluimos grupos detallados
  }));

  fs.writeFileSync(
    path.join(outputDir, 'brands-download.json'),
    JSON.stringify(brandsWithGroups, null, 2)
  );

  // 3. Crear archivo con marcas y modelos
  const brandsWithModels = MOCK_BRANDS.map(brand => ({
    ...brand,
    models: MOCK_MODELS[brand.id] || []
  }));

  fs.writeFileSync(
    path.join(outputDir, 'brands-with-models.json'),
    JSON.stringify(brandsWithModels, null, 2)
  );

  // 4. Crear lista plana de todos los modelos
  const allModels = [];
  Object.values(MOCK_MODELS).forEach(models => {
    allModels.push(...models);
  });

  fs.writeFileSync(
    path.join(outputDir, 'all-models.json'),
    JSON.stringify(allModels, null, 2)
  );

  // 5. Crear estadísticas
  const stats = {
    totalBrands: MOCK_BRANDS.length,
    totalModels: allModels.length,
    modelsWithCodia: allModels.filter(m => m.codia).length,
    modelsWithPrices: allModels.filter(m => m.prices && m.prices.length > 0).length,
    priceRange: {
      min: Math.min(...allModels.map(m => m.list_price || 0)),
      max: Math.max(...allModels.map(m => m.list_price || 0))
    },
    generatedAt: new Date().toISOString(),
    type: 'mock'
  };

  fs.writeFileSync(
    path.join(outputDir, 'stats.json'),
    JSON.stringify(stats, null, 2)
  );

  // 6. Crear archivo de características (features) mock
  const mockFeatures = [
    {
      id: 1,
      description: "Combustible",
      type: "choice",
      category_name: "Motor",
      position: 1,
      choices: [
        { id: 1, description: "Nafta", long_description: "Motor a nafta" },
        { id: 2, description: "Diésel", long_description: "Motor diésel" },
        { id: 3, description: "Eléctrico", long_description: "Vehículo eléctrico" }
      ]
    },
    {
      id: 2,
      description: "Cilindrada",
      type: "decimal",
      category_name: "Motor",
      position: 2,
      decimals: 1
    },
    {
      id: 3,
      description: "Tipo de vehículo",
      type: "choice",
      category_name: "Carrocería",
      position: 3,
      choices: [
        { id: 10, description: "Sedán", long_description: "Automóvil sedán" },
        { id: 11, description: "SUV", long_description: "Vehículo utilitario deportivo" },
        { id: 12, description: "Pick-Up", long_description: "Camioneta pickup" }
      ]
    }
  ];

  fs.writeFileSync(
    path.join(outputDir, 'features.json'),
    JSON.stringify(mockFeatures, null, 2)
  );

  console.log('✅ ¡Datos mock creados exitosamente!\n');

  console.log('📊 Estadísticas:');
  console.log(`   🏷️  ${stats.totalBrands} marcas`);
  console.log(`   🚗 ${stats.totalModels} modelos`);
  console.log(`   🏷️  ${stats.modelsWithCodia} modelos con CODIA`);
  console.log(`   💰 ${stats.modelsWithPrices} modelos con precios históricos`);
  console.log(`   📈 Rango de precios: $${stats.priceRange.min.toLocaleString()} - $${stats.priceRange.max.toLocaleString()}`);

  console.log('\n📁 Archivos creados:');
  console.log('   📄 brands.json - Lista de marcas');
  console.log('   📄 brands-download.json - Marcas con grupos');
  console.log('   📄 brands-with-models.json - Marcas con modelos');
  console.log('   📄 all-models.json - Todos los modelos');
  console.log('   📄 features.json - Características disponibles');
  console.log('   📄 stats.json - Estadísticas');

  console.log('\n🎯 Tu aplicación ahora funcionará completamente sin API!');
  console.log('💡 Cuando necesites datos reales, usa Postman manualmente.');
}

// Ejecutar
createMockData();
