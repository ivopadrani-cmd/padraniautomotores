/**
 * Migration Script: localStorage to Supabase
 * 
 * This script migrates all data from localStorage to Supabase.
 * It handles:
 * - All entities (vehicles, clients, sales, etc.)
 * - Users
 * - Files stored as base64 (converts to Supabase Storage)
 * 
 * Usage:
 * 1. Set up Supabase project and get credentials
 * 2. Set environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * 3. Run: node scripts/migrate-localStorage-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

// Use service role key if available (bypasses RLS), otherwise use anon key
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

// Helper to read from localStorage (simulated)
function getLocalStorageData(key) {
  if (typeof window !== 'undefined' && window.localStorage) {
    const data = window.localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
  
  // For Node.js, we'll need to read from a backup file
  // This assumes you've exported localStorage data to a JSON file
  const backupPath = path.join(__dirname, '../localStorage-backup.json');
  if (fs.existsSync(backupPath)) {
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    return backup[key] || [];
  }
  
  return [];
}

// Helper to convert base64 to file and upload to Supabase Storage
async function migrateBase64File(base64Data, fileName, isPrivate = false) {
  try {
    // Extract base64 data (remove data:image/jpeg;base64, prefix if present)
    const base64Match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    const base64String = base64Match ? base64Match[2] : base64Data;
    const mimeType = base64Match ? base64Match[1] : 'application/octet-stream';
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64String, 'base64');
    
    // Create blob
    const blob = new Blob([buffer], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });
    
    // Upload to Supabase Storage
    const folder = isPrivate ? 'private' : 'public';
    const fileExt = fileName.split('.').pop() || 'bin';
    const newFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${newFileName}`;
    
    const { data, error } = await supabase.storage
      .from('files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error(`Error uploading file ${fileName}:`, error);
      return null;
    }
    
    // Get URL
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
    console.error(`Error processing base64 file ${fileName}:`, error);
    return null;
  }
}

// Migrate photos and documents from base64 to Supabase Storage
async function migrateFiles(entity, entityType) {
  const updates = {};
  
  // Migrate photos
  if (entity.photos && Array.isArray(entity.photos)) {
    const migratedPhotos = [];
    for (const photo of entity.photos) {
      if (photo.url && photo.url.startsWith('data:')) {
        const newUrl = await migrateBase64File(photo.url, photo.name || 'photo.jpg', false);
        if (newUrl) {
          migratedPhotos.push({ ...photo, url: newUrl });
        } else {
          migratedPhotos.push(photo); // Keep original if migration fails
        }
      } else {
        migratedPhotos.push(photo); // Already a URL
      }
    }
    updates.photos = migratedPhotos;
  }
  
  // Migrate documents
  if (entity.documents && Array.isArray(entity.documents)) {
    const migratedDocuments = [];
    for (const doc of entity.documents) {
      if (doc.url && doc.url.startsWith('data:')) {
        const newUrl = await migrateBase64File(doc.url, doc.name || 'document.pdf', false);
        if (newUrl) {
          migratedDocuments.push({ ...doc, url: newUrl });
        } else {
          migratedDocuments.push(doc);
        }
      } else {
        migratedDocuments.push(doc);
      }
    }
    updates.documents = migratedDocuments;
  }
  
  // Migrate attached_documents (for clients)
  if (entity.attached_documents && Array.isArray(entity.attached_documents)) {
    const migratedAttached = [];
    for (const doc of entity.attached_documents) {
      if (doc.url && doc.url.startsWith('data:')) {
        const newUrl = await migrateBase64File(doc.url, doc.name || 'document.pdf', false);
        if (newUrl) {
          migratedAttached.push({ ...doc, url: newUrl });
        } else {
          migratedAttached.push(doc);
        }
      } else {
        migratedAttached.push(doc);
      }
    }
    updates.attached_documents = migratedAttached;
  }
  
  return updates;
}

// Map entity names from localStorage to Supabase table names
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
  'User': 'users',
  'File': 'files' // Files are handled separately
};

// Main migration function
async function migrateEntity(entityName, tableName) {
  console.log(`\nMigrating ${entityName} to ${tableName}...`);
  
  const localStorageKey = `local_db_${entityName}`;
  const items = getLocalStorageData(localStorageKey);
  
  if (items.length === 0) {
    console.log(`  No ${entityName} items found in localStorage`);
    return { migrated: 0, errors: 0 };
  }
  
  console.log(`  Found ${items.length} ${entityName} items`);
  
  let migrated = 0;
  let errors = 0;
  
  for (const item of items) {
    try {
      // Remove id if it's a string (Supabase uses UUID)
      const itemData = { ...item };
      if (itemData.id && typeof itemData.id === 'string' && !itemData.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        delete itemData.id; // Let Supabase generate UUID
      }
      
      // Convert created_date/updated_date to created_at/updated_at if needed
      if (itemData.created_date) {
        itemData.created_at = new Date(itemData.created_date).toISOString();
        delete itemData.created_date;
      }
      if (itemData.updated_date) {
        itemData.updated_at = new Date(itemData.updated_date).toISOString();
        delete itemData.updated_date;
      }
      
      // Migrate files if present
      const fileUpdates = await migrateFiles(itemData, entityName);
      Object.assign(itemData, fileUpdates);
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from(tableName)
        .insert(itemData)
        .select()
        .single();
      
      if (error) {
        // If duplicate, try update instead
        if (error.code === '23505') {
          const { error: updateError } = await supabase
            .from(tableName)
            .update(itemData)
            .eq('id', item.id);
          
          if (updateError) {
            console.error(`  Error updating ${entityName} ${item.id}:`, updateError.message);
            errors++;
          } else {
            migrated++;
          }
        } else {
          console.error(`  Error inserting ${entityName} ${item.id}:`, error.message);
          errors++;
        }
      } else {
        migrated++;
      }
    } catch (error) {
      console.error(`  Error processing ${entityName} item:`, error);
      errors++;
    }
  }
  
  console.log(`  Migrated ${migrated}/${items.length} ${entityName} items (${errors} errors)`);
  return { migrated, errors };
}

// Main migration function
async function runMigration() {
  console.log('Starting migration from localStorage to Supabase...\n');
  
  // First, ensure storage bucket exists
  console.log('Checking storage bucket...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError);
  } else {
    const filesBucket = buckets.find(b => b.name === 'files');
    if (!filesBucket) {
      console.log('Creating files bucket...');
      const { error: createError } = await supabase.storage.createBucket('files', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/*', 'application/pdf', 'application/*']
      });
      if (createError) {
        console.error('Error creating bucket:', createError);
      } else {
        console.log('Files bucket created');
      }
    } else {
      console.log('Files bucket exists');
    }
  }
  
  // Migrate all entities
  const results = {};
  
  for (const [entityName, tableName] of Object.entries(entityMap)) {
    if (entityName === 'File') continue; // Files are handled separately
    
    const result = await migrateEntity(entityName, tableName);
    results[entityName] = result;
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
  console.log('\nMigration completed!');
}

// Run migration
runMigration().catch(console.error);

