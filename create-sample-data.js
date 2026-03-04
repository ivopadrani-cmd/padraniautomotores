// Script para crear datos de ejemplo completos
// Autos en diferentes estados con clientes, contratos, etc.

const sampleData = {
  clients: [
    {
      id: '1',
      full_name: 'Juan Carlos Pérez',
      phone: '+5491123456789',
      email: 'juan.perez@email.com',
      dni: '12345678',
      cuit_cuil: '20123456789',
      address: 'Av. Corrientes 1234',
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      postal_code: '1000',
      birth_date: '1985-03-15',
      marital_status: 'Casado',
      client_status: 'Cliente'
    },
    {
      id: '2',
      full_name: 'María González',
      phone: '+5491187654321',
      email: 'maria.gonzalez@email.com',
      dni: '87654321',
      cuit_cuil: '20876543219',
      address: 'Calle Florida 567',
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      postal_code: '1005',
      birth_date: '1990-07-22',
      marital_status: 'Soltera',
      client_status: 'Cliente'
    },
    {
      id: '3',
      full_name: 'Carlos Rodríguez',
      phone: '+5491155566677',
      email: 'carlos.rodriguez@email.com',
      dni: '11223344',
      cuit_cuil: '20112233449',
      address: 'Av. 9 de Julio 890',
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      postal_code: '1030',
      birth_date: '1978-11-30',
      marital_status: 'Casado',
      client_status: 'Cliente'
    },
    {
      id: '4',
      full_name: 'Ana López',
      phone: '+5491144433322',
      email: 'ana.lopez@email.com',
      dni: '55667788',
      cuit_cuil: '20556677889',
      address: 'Calle Lavalle 345',
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      postal_code: '1040',
      birth_date: '1982-05-10',
      marital_status: 'Divorciada',
      client_status: 'Cliente'
    },
    {
      id: '5',
      full_name: 'Roberto Silva',
      phone: '+5491166655544',
      email: 'roberto.silva@email.com',
      dni: '99887766',
      cuit_cuil: '20998877669',
      address: 'Av. Santa Fe 2100',
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      postal_code: '1050',
      birth_date: '1975-09-18',
      marital_status: 'Casado',
      client_status: 'Cliente'
    }
  ],

  vehicles: [
    // Vehículo DISPONIBLE con todos los datos completos
    {
      id: '1',
      brand: 'FORD',
      model: 'FIESTA',
      year: '2020',
      vehicle_type: 'SEDÁN',
      plate: 'ABC123',
      color: 'BLANCO',
      kilometers: 45000,
      registration_city: 'BUENOS AIRES',
      registration_province: 'BUENOS AIRES',
      engine_brand: 'FORD',
      engine_number: 'ENG123456789',
      chassis_brand: 'FORD',
      chassis_number: 'CHA987654321',
      ownership: 'CONSIGNACIÓN',
      is_consignment: true,
      supplier_client_id: '5',
      supplier_client_name: 'Roberto Silva',
      status: 'DISPONIBLE',
      entry_date: '2024-01-15',
      cost_value: 85000,
      cost_currency: 'USD',
      cost_exchange_rate: 1100,
      target_price_value: 140000,
      target_price_currency: 'ARS',
      public_price_value: 160000,
      public_price_currency: 'ARS',
      infoauto_value: 145000,
      infoauto_currency: 'ARS',
      infoauto_exchange_rate: 1050,
      infoauto_date: '2024-01-15',
      expenses: [
        { type: 'GESTORIA', value: 5000, currency: 'ARS', exchange_rate: 1100, date: '2024-01-15', description: 'Gestoría y patentamiento' },
        { type: 'FLETE', value: 2000, currency: 'USD', exchange_rate: 1100, date: '2024-01-15', description: 'Transporte desde concesionario' }
      ],
      photos: [],
      documents: [
        { name: 'Título de propiedad', type: 'Título', url: '', description: 'Título original del vehículo' },
        { name: 'Verificación policial', type: 'Verificación', url: '', description: 'Verificación policial al día' }
      ],
      documentation_checklist: {
        accessories: {
          manuals: true,
          spare_key: true,
          spare_tire: true,
          jack: true,
          security_nut: true,
          fire_extinguisher: true
        }
      }
    },

    // Vehículo A PERITAR
    {
      id: '2',
      brand: 'RENAULT',
      model: 'SANDERO',
      year: '2019',
      vehicle_type: 'HATCHBACK',
      plate: 'DEF456',
      color: 'GRIS',
      kilometers: 78000,
      registration_city: 'LA PLATA',
      registration_province: 'BUENOS AIRES',
      engine_brand: 'RENAULT',
      engine_number: 'REN456789123',
      chassis_brand: 'RENAULT',
      chassis_number: 'CHS321654987',
      ownership: '100L',
      status: 'A PERITAR',
      entry_date: '2024-02-01',
      inspection_requested_date: '2024-02-01',
      inspection_requested_by: 'Juan Carlos Pérez',
      assigned_mechanic_id: 'mechanic1',
      assigned_mechanic_name: 'Carlos Mecánico',
      cost_value: 65000,
      cost_currency: 'USD',
      cost_exchange_rate: 1150,
      target_price_value: 110000,
      target_price_currency: 'ARS',
      public_price_value: 125000,
      public_price_currency: 'ARS',
      infoauto_value: 105000,
      infoauto_currency: 'ARS',
      infoauto_exchange_rate: 1080,
      infoauto_date: '2024-02-01',
      expenses: [
        { type: 'REPARACION', value: 15000, currency: 'ARS', exchange_rate: 1150, date: '2024-02-01', description: 'Reparación de chapa y pintura' }
      ],
      photos: [],
      documents: []
    },

    // Vehículo EN REPARACIÓN
    {
      id: '3',
      brand: 'CHEVROLET',
      model: 'CRUZE',
      year: '2018',
      vehicle_type: 'SEDÁN',
      plate: 'GHI789',
      color: 'NEGRO',
      kilometers: 95000,
      registration_city: 'MAR DEL PLATA',
      registration_province: 'BUENOS AIRES',
      engine_brand: 'CHEVROLET',
      engine_number: 'CHV789123456',
      chassis_brand: 'CHEVROLET',
      chassis_number: 'CHS654321987',
      ownership: '50L',
      status: 'EN REPARACION',
      entry_date: '2024-01-20',
      cost_value: 55000,
      cost_currency: 'USD',
      cost_exchange_rate: 1050,
      target_price_value: 95000,
      target_price_currency: 'ARS',
      public_price_value: 105000,
      public_price_currency: 'ARS',
      expenses: [],
      photos: [],
      documents: []
    },

    // Vehículo RESERVADO
    {
      id: '4',
      brand: 'TOYOTA',
      model: 'COROLLA',
      year: '2021',
      vehicle_type: 'SEDÁN',
      plate: 'JKL012',
      color: 'AZUL',
      kilometers: 25000,
      registration_city: 'BUENOS AIRES',
      registration_province: 'BUENOS AIRES',
      engine_brand: 'TOYOTA',
      engine_number: 'TOY012345678',
      chassis_brand: 'TOYOTA',
      chassis_number: 'CHS987654321',
      ownership: '100I',
      status: 'RESERVADO',
      entry_date: '2024-01-10',
      cost_value: 120000,
      cost_currency: 'USD',
      cost_exchange_rate: 1180,
      target_price_value: 180000,
      target_price_currency: 'ARS',
      public_price_value: 195000,
      public_price_currency: 'ARS',
      infoauto_value: 185000,
      infoauto_currency: 'ARS',
      infoauto_exchange_rate: 1150,
      infoauto_date: '2024-01-10',
      expenses: [
        { type: 'SEGURO', value: 8000, currency: 'ARS', exchange_rate: 1180, date: '2024-01-10', description: 'Seguro anual' }
      ],
      photos: [],
      documents: []
    },

    // Vehículo VENDIDO con venta completa
    {
      id: '5',
      brand: 'VOLKSWAGEN',
      model: 'GOLF',
      year: '2019',
      vehicle_type: 'HATCHBACK',
      plate: 'MNO345',
      color: 'ROJO',
      kilometers: 55000,
      registration_city: 'BUENOS AIRES',
      registration_province: 'BUENOS AIRES',
      engine_brand: 'VOLKSWAGEN',
      engine_number: 'VW345678901',
      chassis_brand: 'VOLKSWAGEN',
      chassis_number: 'CHS456789012',
      ownership: '100',
      status: 'VENDIDO',
      entry_date: '2024-01-05',
      cost_value: 95000,
      cost_currency: 'USD',
      cost_exchange_rate: 1120,
      target_price_value: 155000,
      target_price_currency: 'ARS',
      public_price_value: 170000,
      public_price_currency: 'ARS',
      expenses: [],
      photos: [],
      documents: []
    },

    // Vehículo ENTREGADO
    {
      id: '6',
      brand: 'PEUGEOT',
      model: '208',
      year: '2020',
      vehicle_type: 'HATCHBACK',
      plate: 'PQR678',
      color: 'BLANCO',
      kilometers: 32000,
      registration_city: 'BUENOS AIRES',
      registration_province: 'BUENOS AIRES',
      engine_brand: 'PEUGEOT',
      engine_number: 'PEU678901234',
      chassis_brand: 'PEUGEOT',
      chassis_number: 'CHS789012345',
      ownership: 'CONSIGNACIÓN',
      is_consignment: true,
      supplier_client_id: '3',
      supplier_client_name: 'Carlos Rodríguez',
      status: 'ENTREGADO',
      entry_date: '2024-01-08',
      cost_value: 78000,
      cost_currency: 'USD',
      cost_exchange_rate: 1140,
      target_price_value: 130000,
      target_price_currency: 'ARS',
      public_price_value: 145000,
      public_price_currency: 'ARS',
      expenses: [],
      photos: [],
      documents: []
    }
  ],

  sales: [
    // Venta del vehículo 5 (VW Golf)
    {
      id: '1',
      vehicle_id: '5',
      client_id: '1',
      sale_date: '2024-02-15',
      client_name: 'Juan Carlos Pérez',
      seller: 'Vendedor Principal',
      sale_price: 170000,
      sale_price_currency: 'ARS',
      sale_price_exchange_rate: 1200,
      deposit: {
        amount: 34000,
        currency: 'ARS',
        exchange_rate: 1200,
        date: '2024-02-15',
        payment_method: 'Transferencia',
        description: 'Seña del 20%'
      },
      financing: {
        amount: 136000,
        currency: 'ARS',
        exchange_rate: 1200,
        bank: 'Banco Nación',
        installments: 60,
        installment_value: 2833,
        date: '2024-02-15'
      },
      observations: 'Venta financiada con Banco Nación'
    },

    // Venta del vehículo 6 (Peugeot 208)
    {
      id: '2',
      vehicle_id: '6',
      client_id: '2',
      sale_date: '2024-02-20',
      client_name: 'María González',
      seller: 'Vendedor Principal',
      sale_price: 145000,
      sale_price_currency: 'ARS',
      sale_price_exchange_rate: 1200,
      cash_payment: {
        amount: 145000,
        currency: 'ARS',
        exchange_rate: 1200,
        date: '2024-02-20',
        payment_method: 'Efectivo'
      },
      observations: 'Pago al contado'
    }
  ],

  reservations: [
    // Reserva del vehículo 4 (Toyota Corolla)
    {
      id: '1',
      vehicle_id: '4',
      client_id: '3',
      reservation_date: '2024-02-10',
      client_name: 'Carlos Rodríguez',
      agreed_price: 190000,
      deposit_amount: 38000,
      deposit_currency: 'ARS',
      deposit_exchange_rate: 1200,
      deposit_date: '2024-02-10',
      deposit_description: 'Seña del 20%',
      financing_amount: 152000,
      financing_bank: 'Banco Provincia',
      financing_installments: 48,
      financing_installment_value: 3333,
      status: 'ACTIVA',
      observations: 'Reserva con financiación aprobada'
    }
  ],

  quotes: [
    // Presupuesto para el vehículo 1 (Ford Fiesta)
    {
      id: '1',
      vehicle_id: '1',
      client_id: '4',
      quote_date: '2024-02-18',
      quoted_price_ars: 160000,
      trade_in_brand: 'CITROEN',
      trade_in_model: 'C4',
      trade_in_year: '2017',
      trade_in_value_ars: 45000
    }
  ],

  leads: [
    // Consulta activa para el vehículo 1
    {
      id: '1',
      client_id: '4',
      client_name: 'Ana López',
      client_phone: '+5491144433322',
      client_email: 'ana.lopez@email.com',
      consultation_date: '2024-02-18',
      consultation_time: '15:30',
      source: 'Salón',
      interested_vehicles: [
        { vehicle_id: '1', vehicle_description: 'FORD FIESTA 2020' }
      ],
      budget: 160000,
      status: 'En negociación',
      interest_level: 'Alto',
      observations: 'Interesada en el Ford Fiesta blanco',
      follow_up_date: '2024-02-25',
      follow_up_time: '10:00'
    }
  ]
};

// Función para cargar datos de ejemplo
function loadSampleData() {
  console.log('🔄 CARGANDO DATOS DE EJEMPLO...\n');

  // Cargar clientes
  console.log('👥 Creando clientes...');
  localStorage.setItem('local_db_clients', JSON.stringify(sampleData.clients));
  console.log(`✅ ${sampleData.clients.length} clientes creados`);

  // Cargar vehículos
  console.log('🚗 Creando vehículos...');
  localStorage.setItem('local_db_vehicles', JSON.stringify(sampleData.vehicles));
  console.log(`✅ ${sampleData.vehicles.length} vehículos creados en diferentes estados`);

  // Cargar ventas
  console.log('💰 Creando ventas...');
  localStorage.setItem('local_db_sales', JSON.stringify(sampleData.sales));
  console.log(`✅ ${sampleData.sales.length} ventas creadas`);

  // Cargar reservas
  console.log('📋 Creando reservas...');
  localStorage.setItem('local_db_reservations', JSON.stringify(sampleData.reservations));
  console.log(`✅ ${sampleData.reservations.length} reservas creadas`);

  // Cargar presupuestos
  console.log('📄 Creando presupuestos...');
  localStorage.setItem('local_db_quotes', JSON.stringify(sampleData.quotes));
  console.log(`✅ ${sampleData.quotes.length} presupuestos creados`);

  // Cargar consultas
  console.log('📞 Creando consultas...');
  localStorage.setItem('local_db_leads', JSON.stringify(sampleData.leads));
  console.log(`✅ ${sampleData.leads.length} consultas creadas`);

  console.log('\n🎉 DATOS DE EJEMPLO CARGADOS EXITOSAMENTE!');
  console.log('\n📊 RESUMEN DE DATOS:');
  console.log('─'.repeat(50));
  console.log(`👥 Clientes: ${sampleData.clients.length}`);
  console.log(`🚗 Vehículos: ${sampleData.vehicles.length}`);
  console.log(`💰 Ventas: ${sampleData.sales.length}`);
  console.log(`📋 Reservas: ${sampleData.reservations.length}`);
  console.log(`📄 Presupuestos: ${sampleData.quotes.length}`);
  console.log(`📞 Consultas: ${sampleData.leads.length}`);

  console.log('\n🏁 Estados de vehículos creados:');
  sampleData.vehicles.forEach(vehicle => {
    console.log(`   ${vehicle.brand} ${vehicle.model} ${vehicle.year} → ${vehicle.status}`);
  });

  console.log('\n🔄 Ahora puedes probar la aplicación con datos reales!');
  console.log('💡 Prueba:');
  console.log('   - Ver lista de vehículos en diferentes estados');
  console.log('   - Ver detalles de vehículos vendidos');
  console.log('   - Ver contratos de venta');
  console.log('   - Ver reservas activas');
  console.log('   - Ver presupuestos');
  console.log('   - Ver consultas del CRM');
}

// Ejecutar carga de datos
loadSampleData();