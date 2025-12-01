import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
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

const COLUMN_MAP = {
  'created_date': 'created_at',
  'updated_date': 'updated_at',
};

const SKIP = ['id', 'is_sample', 'created_by', 'created_by_id', 'client_id'];

function clean(row) {
  const data = { id: uuid() };
  
  for (let [key, val] of Object.entries(row)) {
    if (COLUMN_MAP[key]) key = COLUMN_MAP[key];
    if (SKIP.includes(key)) continue;
    if (!val || val === 'null' || val === '') continue;
    
    if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
      try { data[key] = JSON.parse(val); } catch { data[key] = val; }
    }
    else if (val === 'true') data[key] = true;
    else if (val === 'false') data[key] = false;
    else data[key] = val;
  }
  
  return data;
}

console.log('🔍 Buscando vehículo HPS562...\n');

const csv = readFileSync('C:/Users/usuario/Downloads/Vehicle_export.csv', 'utf-8');
const rows = parse(csv, { columns: true, skip_empty_lines: true });

const vehicle = rows.find(r => r.license_plate === 'HPS562');

if (!vehicle) {
  console.log('❌ Vehículo HPS562 no encontrado en el CSV');
  process.exit(1);
}

console.log('✅ Vehículo encontrado:');
console.log(`   Marca: ${vehicle.make}`);
console.log(`   Modelo: ${vehicle.model}`);
console.log(`   Año: ${vehicle.year}`);
console.log(`   Dominio: ${vehicle.license_plate}`);
console.log(`   Precio: ${vehicle.price} ${vehicle.currency}\n`);

const cleaned = clean(vehicle);

console.log('📦 Importando a Supabase...');

const { error, data } = await supabase
  .from('vehicles')
  .insert(cleaned)
  .select();

if (error) {
  console.log('❌ Error:', error.message);
} else {
  console.log('✅ ¡Vehículo HPS562 importado correctamente!');
  console.log('   ID:', data[0].id);
}

