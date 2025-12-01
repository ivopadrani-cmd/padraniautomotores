import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const vehicle = {
  id: uuid(),
  status: 'A INGRESAR',
  purchase_date: '2025-11-26',
  acquisition_type: 'CONSIGNACIÓN',
  consignment_client_name: 'Nuri',
  is_consignment: true,
  make: 'VOLKSWAGEN',
  model: 'FOX 1.6 CONFORTLINE FA 5P',
  year: 2008,
  license_plate: 'HPS652',
  kilometers: 128000,
  color: 'G. PLATA',
  city: 'COMODORO RIVADAVIA',
  state: 'CHUBUT',
  registration_holder: 'VOLKSWAGEN',
  registration_number: 'BAH397789',
  holder_name: 'VOLKSWAGEN',
  vin: '9BWKB45Z794022574',
  purchase_price: 6000000,
  purchase_currency: 'ARS',
  purchase_exchange_rate: 1200,
  target_sale_price: 7000,
  target_sale_currency: 'USD',
  target_exchange_rate: 1450,
  suggested_sale_price: 10800000,
  suggested_currency: 'ARS',
  suggested_exchange_rate: 1450,
  final_sale_price: 9150000,
  final_sale_currency: 'ARS',
  final_exchange_rate: 1435,
  expenses: [
    {
      type: 'GESTORIA',
      value: 120000,
      currency: 'ARS',
      exchange_rate: 1200,
      date: '2025-06-24',
      description: 'Transferencia'
    },
    {
      type: 'TALLER',
      value: 390000,
      currency: 'ARS',
      exchange_rate: 1200,
      date: '2025-06-28',
      description: 'Perdida de aceite reten, Levantavidrios trasero, llave duplicado con comando., cambio de distribución'
    },
    {
      type: 'TALLER',
      value: 120000,
      currency: 'ARS',
      exchange_rate: 1500,
      date: '2025-09-20',
      description: 'Service aceite y filtros'
    },
    {
      type: 'TALLER',
      value: 40000,
      currency: 'ARS',
      exchange_rate: 1200,
      date: '2025-06-06',
      description: 'Peritaje'
    }
  ],
  photos: [],
  documents: [],
  vehicle_state: {
    maintenance: null,
    documents: {
      original_card: true,
      cat: true,
      domain_report: true,
      fines_report: true
    },
    accessories: {
      manuals: true,
      spare_tire: true,
      jack: true,
      spare_key: true,
      security_nut: false,
      fire_extinguisher: false
    }
  },
  is_sold: false,
  created_at: '2025-11-26T17:07:38.402000',
  updated_at: '2025-11-29T17:32:19.201000'
};

console.log('🚗 Importando VOLKSWAGEN FOX (HPS652)...\n');

const { error, data } = await supabase
  .from('vehicles')
  .insert(vehicle)
  .select();

if (error) {
  console.log('❌ Error:', error.message);
  console.log('Detalles:', error);
} else {
  console.log('✅ ¡Vehículo importado correctamente!');
  console.log('   Marca: VOLKSWAGEN');
  console.log('   Modelo: FOX 1.6 CONFORTLINE FA 5P');
  console.log('   Año: 2008');
  console.log('   Dominio: HPS652');
  console.log('   ID:', data[0].id);
  console.log('\n📸 Nota: Las fotos y documentos originales de Base44');
  console.log('   ya no están disponibles. Deberás subirlas nuevamente.');
}

