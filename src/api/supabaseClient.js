// Supabase API Client - Replaces Base44 and localClient
// Uses Supabase for database, auth, and storage
// Falls back to localStorage if Supabase credentials are not configured

import { createClient } from '@supabase/supabase-js';
import { localClient } from './localClient.js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const useSupabase = supabaseUrl && supabaseAnonKey;

if (!useSupabase) {
  console.warn('Supabase credentials not found. Using localStorage fallback.');
}

const supabase = useSupabase ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) : null;

// Helper to convert Supabase sort format to our format
function parseSort(sort) {
  if (!sort || typeof sort !== 'string') return null;
  const [field, direction] = sort.startsWith('-')
    ? [sort.slice(1), false]
    : [sort, true];
  return { field, ascending: direction };
}

// Helper to build Supabase query from filters
function buildFilterQuery(query, filters) {
  Object.keys(filters).forEach(key => {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value);
    }
  });
  return query;
}

// Entity class for Supabase (with localStorage fallback)
class Entity {
  constructor(tableName, entityName) {
    this.tableName = tableName;
    this.entityName = entityName;
    // Get corresponding localClient entity for fallback
    this.localEntity = localClient.entities[entityName];
  }

  async list(sort = null) {
    if (!useSupabase) return this.localEntity.list(sort);
    
    let query = supabase.from(this.tableName).select('*');
    
    if (sort) {
      const sortConfig = parseSort(sort);
      if (sortConfig) {
        query = query.order(sortConfig.field, { ascending: sortConfig.ascending });
      }
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async filter(filters = {}, sort = null) {
    if (!useSupabase) return this.localEntity.filter(filters, sort);
    
    let query = supabase.from(this.tableName).select('*');
    
    query = buildFilterQuery(query, filters);
    
    if (sort) {
      const sortConfig = parseSort(sort);
      if (sortConfig) {
        query = query.order(sortConfig.field, { ascending: sortConfig.ascending });
      }
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async get(id) {
    if (!useSupabase) return this.localEntity.get(id);
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  async create(data) {
    if (!useSupabase) return this.localEntity.create(data);
    
    // Clean data: remove empty strings, undefined, and fields that don't exist in Supabase
    const cleanData = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      // Skip empty strings, undefined, null (but keep false and 0)
      if (value !== '' && value !== undefined && value !== null) {
        cleanData[key] = value;
      }
      // Keep false and 0 explicitly
      if (value === false || value === 0) {
        cleanData[key] = value;
      }
    });
    
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(cleanData)
      .select()
      .single();
    
    if (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
    return result;
  }

  async update(id, data) {
    if (!useSupabase) return this.localEntity.update(id, data);
    
    // Clean data: remove empty strings, undefined
    const cleanData = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== '' && value !== undefined && value !== null) {
        cleanData[key] = value;
      }
      if (value === false || value === 0) {
        cleanData[key] = value;
      }
    });
    
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(cleanData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }
    if (!result) throw new Error(`${this.tableName} with id ${id} not found`);
    return result;
  }

  async delete(id) {
    if (!useSupabase) return this.localEntity.delete(id);
    
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  }
}

// Auth class using Supabase Auth (with localStorage fallback)
class Auth {
  async me() {
    if (!useSupabase) return localClient.auth.me();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      // Fallback: check for ivopadrani@gmail.com auto-login
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'ivopadrani@gmail.com')
        .single();
      
      if (users) {
        // Auto-login as ivopadrani@gmail.com
        await this.login('ivopadrani@gmail.com', 'gerente123');
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          return {
            id: newUser.id,
            email: newUser.email,
            role: 'Gerente',
            full_name: 'Ivo Padrani',
            ...newUser.user_metadata
          };
        }
      }
      return null;
    }
    
    // Get user role from users table
    const { data: userData } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .single();
    
    // Special handling for ivopadrani@gmail.com - always Gerente
    if (user.email?.toLowerCase() === 'ivopadrani@gmail.com') {
      return {
        id: user.id,
        email: user.email,
        role: 'Gerente',
        full_name: userData?.full_name || user.user_metadata?.full_name || 'Ivo Padrani',
        ...user.user_metadata
      };
    }
    
    return {
      id: user.id,
      email: user.email,
      role: userData?.role || user.user_metadata?.role || 'Administrador',
      full_name: userData?.full_name || user.user_metadata?.full_name || user.email,
      ...user.user_metadata
    };
  }

  getCurrentUser() {
    return this.me();
  }

  async login(email, password) {
    if (!useSupabase) return localClient.auth.login(email, password);
    
    // Special case: ivopadrani@gmail.com
    if (email?.toLowerCase() === 'ivopadrani@gmail.com') {
      // Check if user exists, if not create it
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'ivopadrani@gmail.com')
        .single();
      
      if (!existingUser) {
        // Create user in Supabase Auth
        const { data: authUser, error: signUpError } = await supabase.auth.signUp({
          email: 'ivopadrani@gmail.com',
          password: password || 'gerente123',
          options: {
            data: {
              full_name: 'Ivo Padrani',
              role: 'Gerente'
            }
          }
        });
        
        if (signUpError && signUpError.message !== 'User already registered') {
          throw signUpError;
        }
        
        // Create user in users table
        if (authUser?.user) {
          await supabase.from('users').insert({
            id: authUser.user.id,
            email: 'ivopadrani@gmail.com',
            full_name: 'Ivo Padrani',
            role: 'Gerente'
          });
        }
      }
      
      // Sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'ivopadrani@gmail.com',
        password: password || 'gerente123'
      });
      
      if (signInError) throw signInError;
      
      return {
        id: signInData.user.id,
        email: signInData.user.email,
        role: 'Gerente',
        full_name: 'Ivo Padrani',
        ...signInData.user.user_metadata
      };
    }
    
    // Normal login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Get user role from users table
    const { data: userData } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single();
    
    return {
      id: data.user.id,
      email: data.user.email,
      role: userData?.role || data.user.user_metadata?.role || 'Administrador',
      full_name: userData?.full_name || data.user.user_metadata?.full_name || data.user.email,
      ...data.user.user_metadata
    };
  }

  async logout() {
    if (!useSupabase) return localClient.auth.logout();
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = '/';
  }

  async register(data) {
    if (!useSupabase) return localClient.auth.register(data);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role || 'Administrador'
        }
      }
    });
    
    if (authError) throw authError;
    
    // Create user in users table
    if (authData.user) {
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role || 'Administrador'
      });
      
      if (userError) throw userError;
    }
    
    return {
      id: authData.user.id,
      email: authData.user.email,
      role: data.role || 'Administrador',
      full_name: data.full_name,
      ...authData.user.user_metadata
    };
  }
}

// Integrations class using Supabase Storage (with localStorage fallback)
class Integrations {
  constructor() {
    this.Core = {
      InvokeLLM: async (prompt) => {
        if (!useSupabase) return localClient.integrations.Core.InvokeLLM(prompt);
        // Mock LLM response (can be replaced with real API later)
        return { response: `Mock response for: ${prompt}` };
      },
      
      SendEmail: async (to, subject, body) => {
        if (!useSupabase) return localClient.integrations.Core.SendEmail(to, subject, body);
        // Mock email (can be replaced with SendGrid/Resend later)
        console.log('Mock email sent:', { to, subject, body });
        return { success: true, messageId: 'mock-' + Date.now() };
      },
      
      UploadFile: async ({ file }) => {
        if (!useSupabase) return localClient.integrations.Core.UploadFile({ file });
        
        if (!file) throw new Error('File is required');
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`; // All files in uploads folder
        
        const { data, error } = await supabase.storage
          .from('files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) throw error;
        
        // Get SIGNED URL for private bucket (valid for 1 year)
        const { data: signedUrl, error: urlError } = await supabase.storage
          .from('files')
          .createSignedUrl(filePath, 31536000); // 1 year expiration
        
        if (urlError) throw urlError;
        
        return {
          id: data.path || fileName,
          name: file.name,
          type: file.type,
          size: file.size,
          url: signedUrl.signedUrl,
          file_url: signedUrl.signedUrl,
          path: filePath // Store path for regenerating URLs later
        };
      },
      
      UploadPrivateFile: async (file) => {
        if (!useSupabase) return localClient.integrations.Core.UploadPrivateFile(file);
        
        if (!file) throw new Error('File is required');
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `private/${fileName}`; // Private documents folder
        
        const { data, error } = await supabase.storage
          .from('files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) throw error;
        
        // Get signed URL for private file (1 year expiration)
        const { data: signedUrl, error: urlError } = await supabase.storage
          .from('files')
          .createSignedUrl(filePath, 31536000); // 1 year
        
        if (urlError) throw urlError;
        
        return {
          id: data.path || fileName,
          name: file.name,
          type: file.type,
          size: file.size,
          url: signedUrl.signedUrl,
          file_url: signedUrl.signedUrl,
          path: filePath // Store path for regenerating URLs later
        };
      },
      
      CreateFileSignedUrl: async (fileId) => {
        if (!useSupabase) return localClient.integrations.Core.CreateFileSignedUrl(fileId);
        
        // fileId can be a path or we need to look it up
        // For now, assume fileId is a path
        const { data, error } = await supabase.storage
          .from('files')
          .createSignedUrl(fileId, 3600); // 1 hour
        
        if (error) throw error;
        return data.signedUrl;
      },
      
      ExtractDataFromUploadedFile: async (fileId) => {
        if (!useSupabase) return localClient.integrations.Core.ExtractDataFromUploadedFile(fileId);
        // Mock data extraction (can be replaced with OCR service later)
        return { extracted: true, data: {} };
      },
      
      GenerateImage: async (prompt) => {
        if (!useSupabase) return localClient.integrations.Core.GenerateImage(prompt);
        // Mock image generation (can be replaced with DALL-E/Midjourney later)
        return { url: 'https://via.placeholder.com/512', id: 'img-' + Date.now() };
      }
    };
  }
}

// Create Supabase client similar to Base44 structure
export const supabaseClient = {
  entities: {
    Vehicle: new Entity('vehicles', 'Vehicle'),
    Client: new Entity('clients', 'Client'),
    Sale: new Entity('sales', 'Sale'),
    Transaction: new Entity('transactions', 'Transaction'),
    Service: new Entity('services', 'Service'),
    FinancialRecord: new Entity('financial_records', 'FinancialRecord'),
    CalendarEvent: new Entity('calendar_events', 'CalendarEvent'),
    Lead: new Entity('leads', 'Lead'),
    ContractTemplate: new Entity('contract_templates', 'ContractTemplate'),
    Contract: new Entity('contracts', 'Contract'),
    Document: new Entity('documents', 'Document'),
    DocumentTemplate: new Entity('document_templates', 'DocumentTemplate'),
    Consignment: new Entity('consignments', 'Consignment'),
    Seller: new Entity('sellers', 'Seller'),
    Reservation: new Entity('reservations', 'Reservation'),
    Quote: new Entity('quotes', 'Quote'),
    Branch: new Entity('branches', 'Branch'),
    Task: new Entity('tasks', 'Task'),
    Spouse: new Entity('spouses', 'Spouse'),
    ClauseTemplate: new Entity('clause_templates', 'ClauseTemplate'),
    ExchangeRate: new Entity('exchange_rates', 'ExchangeRate'),
    AgencySettings: new Entity('agency_settings', 'AgencySettings'),
    VehicleInspection: new Entity('vehicle_inspections', 'VehicleInspection'),
  },
  auth: new Auth(),
  integrations: new Integrations()
};

// Export supabase instance for direct access if needed
export { supabase };


