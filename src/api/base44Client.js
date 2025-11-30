// Supabase client - replaces Base44 and localClient
import { supabaseClient } from './supabaseClient';

// Export as base44 for backward compatibility with existing code
export const base44 = supabaseClient;
