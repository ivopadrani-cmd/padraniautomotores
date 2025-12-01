import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

// Leer .env.local específicamente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Faltan variables de entorno. Verifica tu archivo .env.local');
  console.error('   Necesitas: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false }
});

// Directorio donde están los CSV
const CSV_DIR = 'C:\\Users\\usuario\\Downloads';

// Mapeo de nombres de archivo CSV a nombres de tabla en Supabase
const TABLE_MAPPING = {
  'AgencySettings_export.csv': 'agency_settings',
  'ExchangeRate_export.csv': 'exchange_rates',
  'Branch_export.csv': 'branches',
  'Seller_export.csv': 'sellers',
  'Client_export.csv': 'clients',
  'DocumentTemplate_export.csv': 'document_templates',
  'ContractTemplate_export.csv': 'contract_templates',
  'ClauseTemplate_export.csv': 'clause_templates',
  'Vehicle_export.csv': 'vehicles',
  'Lead_export.csv': 'leads',
  'Quote_export.csv': 'quotes',
  'Sale_export.csv': 'sales',
  'Contract_export.csv': 'contracts',
  'Document_export.csv': 'documents',
  'Reservation_export.csv': 'reservations',
  'Consignment_export.csv': 'consignments',
  'Transaction_export.csv': 'transactions',
  'CalendarEvent_export.csv': 'calendar_events',
  'Task_export.csv': 'tasks',
  'VehicleInspection_export.csv': 'vehicle_inspections',
  'Spouse_export.csv': 'spouses',
  'FinancialRecord_export.csv': 'financial_records',
  'Service_export.csv': 'services'
};

// Mapeo de columnas CSV a columnas de Supabase
const COLUMN_MAPPING = {
  'created_date': 'created_at',
  'updated_date': 'updated_at',
  'event_date': 'date',
  'event_time': 'time',
  'task_date': 'date',
  'task_time': 'time',
  'quote_date': 'date',
  'consultation_date': 'date',
  'consultation_time': 'time'
};

// Función para generar UUID v4 válido
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Columnas que sabemos que no existen en Supabase (saltar)
const SKIP_COLUMNS = [
  'is_sample', 'created_by', 'created_by_id',
  'consignment_client_id', 'consignment_client_name',
  'cash_payments', 'trade_ins', 
  'is_default', 'content',
  'document_name', 'document_content', 'document_date',
  'lead_id', 'client_name', 'vehicle_description',
  'seller_name', 'client_id', 'client_phone',
  'related_vehicle_description', 'related_client_name'
];

// Función para limpiar y transformar datos
function cleanData(row, tableName) {
  const cleaned = {};
  
  // Generar nuevo UUID para el campo id
  if (row.id) {
    cleaned.id = generateUUID();
  }
  
  for (const [key, value] of Object.entries(row)) {
    // Saltar la columna id (ya la generamos arriba)
    if (key === 'id') continue;
    
    // Mapear nombres de columnas si es necesario
    const columnName = COLUMN_MAPPING[key] || key;
    
    // Saltar columnas que no existen en Supabase
    if (SKIP_COLUMNS.includes(key)) {
      continue;
    }
    
    // Manejar valores vacíos
    if (value === '' || value === null || value === 'null') {
      // No agregar la columna si está vacía (usar defaults de DB)
      continue;
    }
    
    // Parsear JSON si es necesario
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        cleaned[columnName] = JSON.parse(value);
      } catch (e) {
        cleaned[columnName] = value;
      }
    } else if (value === 'true') {
      cleaned[columnName] = true;
    } else if (value === 'false') {
      cleaned[columnName] = false;
    } else {
      cleaned[columnName] = value;
    }
  }
  
  return cleaned;
}

// Función para leer y parsear un CSV
function readCSV(filename) {
  const filePath = path.join(CSV_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Archivo no encontrado: ${filename}`);
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Si el archivo está vacío o solo tiene header
  if (!content.trim() || content.trim().split('\n').length <= 1) {
    console.log(`ℹ️  Archivo vacío: ${filename}`);
    return [];
  }
  
  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true
    });
    
    return records;
  } catch (error) {
    console.error(`❌ Error parseando ${filename}:`, error.message);
    return [];
  }
}

// Función para importar una tabla
async function importTable(filename, tableName) {
  console.log(`\n📦 Importando ${tableName}...`);
  
  const records = readCSV(filename);
  
  if (records.length === 0) {
    console.log(`   ⏭️  Sin datos para importar`);
    return { success: 0, errors: 0 };
  }
  
  console.log(`   📊 ${records.length} registros encontrados`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const cleanedData = cleanData(record, tableName);
    
    try {
      const { error } = await supabase
        .from(tableName)
        .insert(cleanedData);
      
      if (error) {
        console.error(`   ❌ Error en registro ${i + 1}:`, error.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`   ✓ ${successCount}/${records.length} importados...`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Error en registro ${i + 1}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`   ✅ ${successCount} exitosos, ❌ ${errorCount} errores`);
  return { success: successCount, errors: errorCount };
}

// Función principal
async function main() {
  console.log('🚀 INICIANDO IMPORTACIÓN DE CSV A SUPABASE\n');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  const stats = {
    total: 0,
    success: 0,
    errors: 0
  };
  
  // Orden de importación (respeta foreign keys)
  const importOrder = [
    'AgencySettings_export.csv',
    'ExchangeRate_export.csv',
    'Branch_export.csv',
    'Seller_export.csv',
    'Client_export.csv',
    'DocumentTemplate_export.csv',
    'ContractTemplate_export.csv',
    'ClauseTemplate_export.csv',
    'Vehicle_export.csv',
    'Lead_export.csv',
    'Quote_export.csv',
    'Sale_export.csv',
    'Contract_export.csv',
    'Document_export.csv',
    'Reservation_export.csv',
    'Consignment_export.csv',
    'Transaction_export.csv',
    'CalendarEvent_export.csv',
    'Task_export.csv',
    'VehicleInspection_export.csv',
    'Spouse_export.csv',
    'FinancialRecord_export.csv',
    'Service_export.csv'
  ];
  
  for (const filename of importOrder) {
    const tableName = TABLE_MAPPING[filename];
    if (!tableName) {
      console.log(`⚠️  Tabla no mapeada para: ${filename}`);
      continue;
    }
    
    const result = await importTable(filename, tableName);
    stats.total += result.success + result.errors;
    stats.success += result.success;
    stats.errors += result.errors;
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 RESUMEN FINAL:');
  console.log(`   Total de registros procesados: ${stats.total}`);
  console.log(`   ✅ Exitosos: ${stats.success}`);
  console.log(`   ❌ Errores: ${stats.errors}`);
  console.log(`   ⏱️  Tiempo: ${duration}s`);
  console.log('\n🎉 IMPORTACIÓN COMPLETADA\n');
  
  // Notas importantes
  console.log('⚠️  NOTAS IMPORTANTES:');
  console.log('   • Las URLs de archivos de Base44 ya no funcionarán');
  console.log('   • Deberás re-subir fotos y documentos a Supabase Storage');
  console.log('   • Verifica los datos en Supabase antes de usar en producción');
  console.log('   • Los usuarios NO se crearon en auth.users (hazlo manualmente)');
}

// Ejecutar
main().catch(error => {
  console.error('\n💥 ERROR FATAL:', error);
  process.exit(1);
});

