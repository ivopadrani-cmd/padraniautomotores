import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

// Simular localStorage
const localStorage = {};

// Función para guardar datos
function saveToLocalStorage(key, data) {
  localStorage[key] = JSON.stringify(data);
  console.log(`✅ Guardado ${data.length} registros en ${key}`);
}

// Función para limpiar datos CSV
function cleanData(row) {
  const cleaned = {};
  for (const [key, value] of Object.entries(row)) {
    if (!value || value === '' || value === 'null') continue;

    // Parsear JSON si es necesario
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        cleaned[key] = JSON.parse(value);
      } catch {
        cleaned[key] = value;
      }
    } else if (value === 'true') {
      cleaned[key] = true;
    } else if (value === 'false') {
      cleaned[key] = false;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// Función para importar archivo CSV
function importCSV(tableName, filePath) {
  try {
    const csv = readFileSync(filePath, 'utf-8');
    if (!csv.trim()) {
      console.log(`ℹ️  ${tableName}: archivo vacío`);
      return 0;
    }

    const rows = parse(csv, { columns: true, skip_empty_lines: true });
    if (!rows.length) {
      console.log(`ℹ️  ${tableName}: sin datos`);
      return 0;
    }

    const cleanedData = rows.map((row, index) => ({
      id: (index + 1).toString(),
      ...cleanData(row),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }));

    saveToLocalStorage(`local_db_${tableName}`, cleanedData);
    return cleanedData.length;
  } catch (error) {
    console.error(`❌ Error importando ${tableName}:`, error.message);
    return 0;
  }
}

// Archivos CSV a importar
const csvFiles = [
  ['AgencySettings', 'C:/Users/usuario/Downloads/AgencySettings_export.csv'],
  ['ExchangeRate', 'C:/Users/usuario/Downloads/ExchangeRate_export.csv'],
  ['Branch', 'C:/Users/usuario/Downloads/Branch_export.csv'],
  ['Seller', 'C:/Users/usuario/Downloads/Seller_export.csv'],
  ['Client', 'C:/Users/usuario/Downloads/Client_export.csv'],
  ['Vehicle', 'C:/Users/usuario/Downloads/Vehicle_export.csv'],
  ['Lead', 'C:/Users/usuario/Downloads/Lead_export.csv'],
  ['Sale', 'C:/Users/usuario/Downloads/Sale_export.csv'],
  ['Quote', 'C:/Users/usuario/Downloads/Quote_export.csv'],
  ['Reservation', 'C:/Users/usuario/Downloads/Reservation_export.csv'],
  ['Task', 'C:/Users/usuario/Downloads/Task_export.csv'],
  ['CalendarEvent', 'C:/Users/usuario/Downloads/CalendarEvent_export.csv'],
];

console.log('🚀 IMPORTANDO DATOS CSV A LOCALSTORAGE\n');

let totalRecords = 0;

for (const [tableName, filePath] of csvFiles) {
  process.stdout.write(`📦 ${tableName}... `);
  const count = importCSV(tableName, filePath);
  totalRecords += count;
  console.log(`${count} registros`);
}

// Crear archivo de respaldo
const backupData = {
  data: localStorage,
  imported_at: new Date().toISOString(),
  total_records: totalRecords
};

import('fs').then(fs => {
  fs.writeFileSync('localStorage-backup.json', JSON.stringify(backupData, null, 2));
  console.log('\n💾 Respaldo guardado en localStorage-backup.json');
});

console.log(`\n✅ IMPORTACIÓN COMPLETA:`);
console.log(`   📊 Total de registros: ${totalRecords}`);
console.log(`   💾 Datos guardados en localStorage simulado`);
console.log(`   🔄 Para usar en el navegador, importa el archivo localStorage-backup.json`);




