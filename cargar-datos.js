// Script para cargar datos de ejemplo en Padrani Automotores
// Instrucciones:
// 1. Abre http://localhost:5173
// 2. Presiona F12 para abrir la consola del navegador
// 3. Copia TODO el contenido de este archivo
// 4. Pégalo en la consola y presiona Enter
// 5. Recarga la página (F5)

console.log('🚀 Iniciando carga de datos de ejemplo...');

// Limpiar datos existentes
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('local_db_') || key === 'current_user') {
    localStorage.removeItem(key);
  }
});

// Datos de ejemplo
const sampleData = {
  // Vehículos de ejemplo
  'local_db_Vehicle': [
    {
      id: '1',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      price: 15000000,
      mileage: 45000,
      color: 'Blanco',
      fuel_type: 'Nafta',
      transmission: 'Manual',
      doors: 4,
      engine_capacity: '1.8',
      status: 'Disponible',
      location: 'Sucursal Central',
      features: ['Aire acondicionado', 'Dirección asistida', 'ABS'],
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    },
    {
      id: '2',
      brand: 'Ford',
      model: 'Fiesta',
      year: 2019,
      price: 12000000,
      mileage: 30000,
      color: 'Rojo',
      fuel_type: 'Nafta',
      transmission: 'Manual',
      doors: 4,
      engine_capacity: '1.6',
      status: 'Reservado',
      location: 'Sucursal Central',
      features: ['Aire acondicionado', 'Bluetooth'],
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    },
    {
      id: '3',
      brand: 'Volkswagen',
      model: 'Gol',
      year: 2021,
      price: 13500000,
      mileage: 25000,
      color: 'Azul',
      fuel_type: 'Nafta',
      transmission: 'Manual',
      doors: 4,
      engine_capacity: '1.6',
      status: 'Vendido',
      location: 'Sucursal Central',
      features: ['Aire acondicionado', 'Dirección asistida'],
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }
  ],

  // Clientes de ejemplo
  'local_db_Client': [
    {
      id: '1',
      first_name: 'Juan',
      last_name: 'Pérez',
      email: 'juan@email.com',
      phone: '11-1234-5678',
      dni: '12345678',
      address: 'Calle 123',
      city: 'Buenos Aires',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    },
    {
      id: '2',
      first_name: 'María',
      last_name: 'García',
      email: 'maria@email.com',
      phone: '11-9876-5432',
      dni: '87654321',
      address: 'Av. Corrientes 456',
      city: 'Buenos Aires',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }
  ],

  // Vendedores de ejemplo
  'local_db_Seller': [
    {
      id: '1',
      first_name: 'Carlos',
      last_name: 'Rodríguez',
      email: 'carlos@padrani.com',
      phone: '11-555-0101',
      role: 'Vendedor',
      is_active: true,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    },
    {
      id: '2',
      first_name: 'Ana',
      last_name: 'Martínez',
      email: 'ana@padrani.com',
      phone: '11-555-0102',
      role: 'Vendedor',
      is_active: true,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }
  ],

  // Ventas de ejemplo
  'local_db_Sale': [
    {
      id: '1',
      vehicle_id: '3',
      client_id: '1',
      seller_id: '1',
      sale_price: 13500000,
      sale_date: '2025-01-15',
      status: 'Completada',
      payment_method: 'Contado',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }
  ],

  // Configuración de agencia
  'local_db_AgencySettings': [
    {
      id: '1',
      agency_name: 'Padrani Automotores',
      address: 'Av. Libertador 1234',
      city: 'Buenos Aires',
      phone: '11-4444-5555',
      email: 'info@padrani.com',
      cuit: '30-12345678-9',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }
  ]
};

// Guardar datos en localStorage
Object.entries(sampleData).forEach(([key, data]) => {
  localStorage.setItem(key, JSON.stringify(data));
  console.log(`✅ ${key}: ${data.length} registros`);
});

// Configurar usuario administrador
localStorage.setItem('current_user', JSON.stringify({
  id: '1',
  email: 'admin@padrani.com',
  name: 'Admin',
  full_name: 'Administrador',
  role: 'Gerente',
  created_at: new Date().toISOString()
}));

console.log('👤 Usuario administrador configurado');

console.log('');
console.log('🎉 ¡DATOS CARGADOS EXITOSAMENTE!');
console.log('');
console.log('📊 Resumen:');
console.log('   🚗 Vehículos: 3');
console.log('   👥 Clientes: 2');
console.log('   👨‍💼 Vendedores: 2');
console.log('   💰 Ventas: 1');
console.log('   🏢 Agencia: 1');
console.log('   👤 Usuario: 1 (Gerente)');
console.log('');
console.log('🔄 AHORA RECARGA LA PÁGINA (F5) PARA VER LOS DATOS');
console.log('');
console.log('💡 Si no ves los datos, verifica que estés en http://localhost:5173');




