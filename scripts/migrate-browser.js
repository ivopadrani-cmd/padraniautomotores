/**
 * Browser-based Migration Script
 * 
 * Run this in the browser console to migrate localStorage data to Supabase
 * 
 * Usage:
 * 1. Open your app in the browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Run: migrateToSupabase()
 */

async function migrateToSupabase() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || prompt('Enter Supabase URL:');
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || prompt('Enter Supabase Anon Key:');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials required');
    return;
  }
  
  // Import Supabase client dynamically
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Entity mapping
  const entityMap = {
    'Vehicle': 'vehicles',
    'Client': 'clients',
    'Sale': 'sales',
    'Transaction': 'transactions',
    'Service': 'services',
    'FinancialRecord': 'financial_records',
    'CalendarEvent': 'calendar_events',
    'Lead': 'leads',
    'ContractTemplate': 'contract_templates',
    'Contract': 'contracts',
    'Document': 'documents',
    'DocumentTemplate': 'document_templates',
    'Consignment': 'consignments',
    'Seller': 'sellers',
    'Reservation': 'reservations',
    'Quote': 'quotes',
    'Branch': 'branches',
    'Task': 'tasks',
    'Spouse': 'spouses',
    'ClauseTemplate': 'clause_templates',
    'ExchangeRate': 'exchange_rates',
    'AgencySettings': 'agency_settings',
    'VehicleInspection': 'vehicle_inspections',
  };
  
  // Helper to migrate base64 files
  async function migrateFile(base64Data, fileName, isPrivate = false) {
    try {
      const base64Match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      const base64String = base64Match ? base64Match[2] : base64Data;
      const mimeType = base64Match ? base64Match[1] : 'application/octet-stream';
      
      // Convert base64 to blob
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      const folder = isPrivate ? 'private' : 'public';
      const fileExt = fileName.split('.').pop() || 'bin';
      const newFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${newFileName}`;
      
      const { data, error } = await supabase.storage
        .from('files')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error(`Error uploading ${fileName}:`, error);
        return null;
      }
      
      if (isPrivate) {
        const { data: signedUrl } = await supabase.storage
          .from('files')
          .createSignedUrl(filePath, 31536000);
        return signedUrl?.signedUrl || null;
      } else {
        const { data: urlData } = supabase.storage
          .from('files')
          .getPublicUrl(filePath);
        return urlData.publicUrl;
      }
    } catch (error) {
      console.error(`Error processing file ${fileName}:`, error);
      return null;
    }
  }
  
  // Migrate entity
  async function migrateEntity(entityName, tableName) {
    const localStorageKey = `local_db_${entityName}`;
    const items = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
    
    if (items.length === 0) {
      console.log(`No ${entityName} items found`);
      return { migrated: 0, errors: 0 };
    }
    
    console.log(`Migrating ${items.length} ${entityName} items...`);
    let migrated = 0;
    let errors = 0;
    
    for (const item of items) {
      try {
        const itemData = { ...item };
        
        // Remove old id if not UUID
        if (itemData.id && typeof itemData.id === 'string' && 
            !itemData.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          delete itemData.id;
        }
        
        // Convert dates
        if (itemData.created_date) {
          itemData.created_at = new Date(itemData.created_date).toISOString();
          delete itemData.created_date;
        }
        if (itemData.updated_date) {
          itemData.updated_at = new Date(itemData.updated_date).toISOString();
          delete itemData.updated_date;
        }
        
        // Migrate files
        if (itemData.photos && Array.isArray(itemData.photos)) {
          for (let i = 0; i < itemData.photos.length; i++) {
            const photo = itemData.photos[i];
            if (photo.url && photo.url.startsWith('data:')) {
              const newUrl = await migrateFile(photo.url, photo.name || 'photo.jpg');
              if (newUrl) itemData.photos[i].url = newUrl;
            }
          }
        }
        
        if (itemData.documents && Array.isArray(itemData.documents)) {
          for (let i = 0; i < itemData.documents.length; i++) {
            const doc = itemData.documents[i];
            if (doc.url && doc.url.startsWith('data:')) {
              const newUrl = await migrateFile(doc.url, doc.name || 'document.pdf');
              if (newUrl) itemData.documents[i].url = newUrl;
            }
          }
        }
        
        if (itemData.attached_documents && Array.isArray(itemData.attached_documents)) {
          for (let i = 0; i < itemData.attached_documents.length; i++) {
            const doc = itemData.attached_documents[i];
            if (doc.url && doc.url.startsWith('data:')) {
              const newUrl = await migrateFile(doc.url, doc.name || 'document.pdf');
              if (newUrl) itemData.attached_documents[i].url = newUrl;
            }
          }
        }
        
        // Insert into Supabase
        const { error } = await supabase
          .from(tableName)
          .insert(itemData);
        
        if (error) {
          console.error(`Error inserting ${entityName} ${item.id}:`, error.message);
          errors++;
        } else {
          migrated++;
        }
      } catch (error) {
        console.error(`Error processing ${entityName} item:`, error);
        errors++;
      }
    }
    
    console.log(`Migrated ${migrated}/${items.length} ${entityName} items (${errors} errors)`);
    return { migrated, errors };
  }
  
  // Run migration
  console.log('Starting migration...');
  const results = {};
  
  for (const [entityName, tableName] of Object.entries(entityMap)) {
    results[entityName] = await migrateEntity(entityName, tableName);
  }
  
  // Summary
  console.log('\n=== Migration Summary ===');
  let totalMigrated = 0;
  let totalErrors = 0;
  
  for (const [entityName, result] of Object.entries(results)) {
    totalMigrated += result.migrated;
    totalErrors += result.errors;
    console.log(`${entityName}: ${result.migrated} migrated, ${result.errors} errors`);
  }
  
  console.log(`\nTotal: ${totalMigrated} items migrated, ${totalErrors} errors`);
  console.log('Migration completed!');
  
  return results;
}

// Export for use
window.migrateToSupabase = migrateToSupabase;

