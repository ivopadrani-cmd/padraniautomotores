import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generar UUID v4
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// Columnas a ignorar
const SKIP = ['id', 'is_sample', 'created_by', 'created_by_id', 'consignment_client_id', 
  'consignment_client_name', 'cash_payments', 'trade_ins', 'is_default', 'content',
  'document_name', 'document_content', 'document_date', 'lead_id', 'client_name',
  'vehicle_description', 'seller_name', 'client_id', 'client_phone', 
  'related_vehicle_description', 'related_client_name', 'date', 'status'];

// Limpiar datos
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

// Importar tabla
async function importTable(name, file) {
  try {
    const csv = readFileSync(file, 'utf-8');
    if (!csv.trim()) return { ok: 0, err: 0 };
    
    const rows = parse(csv, { columns: true, skip_empty_lines: true });
    if (!rows.length) return { ok: 0, err: 0 };
    
    const cleaned = rows.map(clean);
    
    // Insertar en lotes de 50
    let ok = 0, err = 0;
    for (let i = 0; i < cleaned.length; i += 50) {
      const batch = cleaned.slice(i, i + 50);
      const { error } = await supabase.from(name).insert(batch);
      if (error) err += batch.length;
      else ok += batch.length;
    }
    
    return { ok, err };
  } catch (error) {
    console.error(`Error en ${name}:`, error.message);
    return { ok: 0, err: 0 };
  }
}

// Tablas esenciales en orden
const TABLES = [
  ['agency_settings', 'C:/Users/usuario/Downloads/AgencySettings_export.csv'],
  ['exchange_rates', 'C:/Users/usuario/Downloads/ExchangeRate_export.csv'],
  ['branches', 'C:/Users/usuario/Downloads/Branch_export.csv'],
  ['sellers', 'C:/Users/usuario/Downloads/Seller_export.csv'],
  ['clients', 'C:/Users/usuario/Downloads/Client_export.csv'],
  ['vehicles', 'C:/Users/usuario/Downloads/Vehicle_export.csv'],
  ['leads', 'C:/Users/usuario/Downloads/Lead_export.csv'],
  ['sales', 'C:/Users/usuario/Downloads/Sale_export.csv'],
  ['quotes', 'C:/Users/usuario/Downloads/Quote_export.csv'],
  ['reservations', 'C:/Users/usuario/Downloads/Reservation_export.csv'],
  ['tasks', 'C:/Users/usuario/Downloads/Task_export.csv'],
  ['calendar_events', 'C:/Users/usuario/Downloads/CalendarEvent_export.csv'],
];

console.log('🚀 Importando CSV (modo rápido)...\n');

let totalOk = 0, totalErr = 0;
const start = Date.now();

for (const [table, file] of TABLES) {
  process.stdout.write(`📦 ${table}...`);
  const { ok, err } = await importTable(table, file);
  totalOk += ok;
  totalErr += err;
  console.log(` ✅ ${ok} | ❌ ${err}`);
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`\n✅ Total: ${totalOk} exitosos, ${totalErr} errores (${elapsed}s)`);

