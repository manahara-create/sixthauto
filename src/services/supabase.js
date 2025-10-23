// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hlyeyxeyfxmirmkxebks.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhseWV5eGV5ZnhtaXJta3hlYmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTIyNDUsImV4cCI6MjA3NjY2ODI0NX0.btFxXy8hiFaghq-4aE5sNHdapOqXWsyU9OvIj8f4Yi4";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error);
  
  if (error.message.includes('JWT')) {
    return 'Authentication error. Please log in again.';
  }
  
  if (error.message.includes('network')) {
    return 'Network error. Please check your connection.';
  }
  
  if (error.message.includes('duplicate key')) {
    return 'Record already exists.';
  }
  
  return error.message || 'An unexpected error occurred.';
};

// Storage helper functions
export const uploadFile = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);

  if (error) throw error;
  return data;
};

export const getFileUrl = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

export const deleteFile = async (bucket, path) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) throw error;
};