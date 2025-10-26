import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nwmnyjgyjcfcaodohdue.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bW55amd5amNmY2FvZG9oZHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTgxNzksImV4cCI6MjA3Njk3NDE3OX0.c1U0XlW2ZuAcoe4zEPgRhK0WMYnCOS6xee4e4lyb0v4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);