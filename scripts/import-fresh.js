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

const SKIP = ['id', 'is_sample', 'created_by', 'created_by_id'];

function clean(row) {
  const data = { id: uuid() };
  for (const [key, val] of Object.entries(row)) {
    if (SKIP.includes(key) || !val || val === 'null' || val === '') continue;
    if (val.startsWith('{') || val.startsWith('[')) {
      try { data[key] = JSON.parse(val); } catch { data[key] = val; }
    } else if (val === 'true') data[key] = true;
    else if (val === 'false') data[key] = false;
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
    
    // Limpiar datos existentes
    await supabase.from(name).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const cleaned = rows.map(clean);
    
    // Insertar en lotes de 100
    let imported = 0;
    for (let i = 0; i < cleaned.length; i += 100) {
      const batch = cleaned.slice(i, i + 100);
      const { error, data } = await supabase.from(name).insert(batch).select();
      if (!error && data) imported += data.length;
    }
    
    return imported;
  } catch (error) {
    console.error(`❌ Error en ${name}:`, error.message);
    return 0;
  }
}

const TABLES = [
  ['sellers', 'C:/Users/usuario/Downloads/Seller_export.csv'],
  ['clients', 'C:/Users/usuario/Downloads/Client_export.csv'],
  ['vehicles', 'C:/Users/usuario/Downloads/Vehicle_export.csv'],
  ['leads', 'C:/Users/usuario/Downloads/Lead_export.csv'],
];

console.log('🚀 Importación FRESCA (limpia y carga)\n');

for (const [table, file] of TABLES) {
  process.stdout.write(`📦 ${table}... `);
  const count = await importTable(table, file);
  console.log(`✅ ${count} registros`);
}

console.log('\n✅ Importación completada');

