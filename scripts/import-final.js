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

// Mapeo de columnas CSV → Supabase
const COLUMN_MAP = {
  'created_date': 'created_at',
  'updated_date': 'updated_at',
  'user_id': 'auth_user_id',
};

// Columnas a ignorar completamente
const SKIP = ['id', 'is_sample', 'created_by', 'created_by_id', 'is_consignment', 'client_id'];

function clean(row) {
  const data = { id: uuid() };
  
  for (let [key, val] of Object.entries(row)) {
    // Mapear nombres de columnas
    if (COLUMN_MAP[key]) key = COLUMN_MAP[key];
    
    // Ignorar columnas innecesarias
    if (SKIP.includes(key)) continue;
    
    // Ignorar valores vacíos
    if (!val || val === 'null' || val === '') continue;
    
    // Parsear JSON
    if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
      try { 
        data[key] = JSON.parse(val); 
      } catch { 
        data[key] = val; 
      }
    }
    // Booleans
    else if (val === 'true') data[key] = true;
    else if (val === 'false') data[key] = false;
    // Resto
    else data[key] = val;
  }
  
  return data;
}

async function importTable(name, file) {
  try {
    const csv = readFileSync(file, 'utf-8');
    if (!csv.trim()) return 0;
    
    const rows = parse(csv, { columns: true, skip_empty_lines: true });
    if (!rows.length) return 0;
    
    const cleaned = rows.map(clean);
    
    // Insertar de a uno para ver errores
    let imported = 0;
    for (const record of cleaned) {
      const { error, data } = await supabase.from(name).insert(record).select();
      if (!error && data) {
        imported++;
      } else if (error) {
        // Solo mostrar primer error
        if (imported === 0) {
          console.log(`\n  ⚠️  Error: ${error.message}`);
        }
      }
    }
    
    return imported;
  } catch (error) {
    console.log(`\n  ❌ ${error.message}`);
    return 0;
  }
}

const TABLES = [
  ['sellers', 'C:/Users/usuario/Downloads/Seller_export.csv'],
  ['clients', 'C:/Users/usuario/Downloads/Client_export.csv'],
  ['vehicles', 'C:/Users/usuario/Downloads/Vehicle_export.csv'],
  ['leads', 'C:/Users/usuario/Downloads/Lead_export.csv'],
];

console.log('🚀 Importando datos de prueba...\n');

let total = 0;
for (const [table, file] of TABLES) {
  process.stdout.write(`📦 ${table}... `);
  const count = await importTable(table, file);
  console.log(`✅ ${count}`);
  total += count;
}

console.log(`\n✅ Total importado: ${total} registros`);

