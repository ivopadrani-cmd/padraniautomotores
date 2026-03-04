// Script para importar datos al navegador
// Instrucciones:
// 1. Abre http://localhost:5173 en tu navegador
// 2. Presiona F12 para abrir la consola
// 3. Copia y pega todo este archivo en la consola
// 4. Presiona Enter
// 5. Recarga la página

// Paso 1: Limpiar datos existentes
console.log('🧹 Limpiando datos existentes...');
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('local_db_') || key === 'current_user') {
    localStorage.removeItem(key);
  }
});

// Paso 2: Importar datos de vehículos
console.log('🚗 Importando vehículos...');
localStorage.setItem('local_db_Vehicle', '[{"id":"1","brand":"Toyota","model":"Corolla","year":2020,"price":15000000,"mileage":45000,"color":"Blanco","fuel_type":"Nafta","transmission":"Manual","doors":4,"engine_capacity":"1.8","vin":"ABC123456789","features":["Aire acondicionado","Dirección asistida"],"status":"Disponible","location":"Sucursal Central","created_date":"2025-01-27T20:45:00.000Z","updated_date":"2025-01-27T20:45:00.000Z"},{"id":"2","brand":"Ford","model":"Fiesta","year":2019,"price":12000000,"mileage":30000,"color":"Rojo","fuel_type":"Nafta","transmission":"Manual","doors":4,"engine_capacity":"1.6","vin":"DEF987654321","features":["Aire acondicionado","Bluetooth"],"status":"Reservado","location":"Sucursal Central","created_date":"2025-01-27T20:45:00.000Z","updated_date":"2025-01-27T20:45:00.000Z"}]');

// Paso 3: Importar datos de clientes
console.log('👥 Importando clientes...');
localStorage.setItem('local_db_Client', '[{"id":"1","first_name":"Juan","last_name":"Pérez","email":"juan@email.com","phone":"123456789","dni":"12345678","address":"Calle 123","city":"Buenos Aires","created_date":"2025-01-27T20:45:00.000Z","updated_date":"2025-01-27T20:45:00.000Z"},{"id":"2","first_name":"María","last_name":"García","email":"maria@email.com","phone":"987654321","dni":"87654321","address":"Av. Corrientes 456","city":"Buenos Aires","created_date":"2025-01-27T20:45:00.000Z","updated_date":"2025-01-27T20:45:00.000Z"}]');

// Paso 4: Importar vendedores
console.log('👨‍💼 Importando vendedores...');
localStorage.setItem('local_db_Seller', '[{"id":"1","first_name":"Carlos","last_name":"Rodríguez","email":"carlos@padrani.com","phone":"555-0101","role":"Vendedor","is_active":true,"created_date":"2025-01-27T20:45:00.000Z","updated_date":"2025-01-27T20:45:00.000Z"},{"id":"2","first_name":"Ana","last_name":"Martínez","email":"ana@padrani.com","phone":"555-0102","role":"Vendedor","is_active":true,"created_date":"2025-01-27T20:45:00.000Z","updated_date":"2025-01-27T20:45:00.000Z"}]');

// Paso 5: Configurar usuario actual (Gerente)
console.log('👤 Configurando usuario administrador...');
localStorage.setItem('current_user', JSON.stringify({
  id: '1',
  email: 'admin@padrani.com',
  name: 'Admin',
  full_name: 'Administrador',
  role: 'Gerente',
  created_at: new Date().toISOString()
}));

// Paso 6: Verificar importación
console.log('✅ IMPORTACIÓN COMPLETA');
console.log('📊 Datos importados:');
console.log('   - Vehículos: 2');
console.log('   - Clientes: 2');
console.log('   - Vendedores: 2');
console.log('   - Usuario: 1 (Gerente)');
console.log('');
console.log('🔄 RECARGA LA PÁGINA PARA VER LOS DATOS');
console.log('');
console.log('💡 Si no ves los datos, revisa la consola por errores.');




