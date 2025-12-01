import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tables = [
  'agency_settings', 'exchange_rates', 'branches', 'sellers', 
  'clients', 'vehicles', 'leads', 'sales', 'quotes', 
  'reservations', 'tasks', 'calendar_events'
];

console.log('📊 Verificando datos en Supabase:\n');

for (const table of tables) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  
  if (error) console.log(`❌ ${table}: Error`);
  else console.log(`✅ ${table}: ${count} registros`);
}

