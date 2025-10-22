import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hlyeyxeyfxmirmkxebks.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhseWV5eGV5ZnhtaXJta3hlYmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTIyNDUsImV4cCI6MjA3NjY2ODI0NX0.btFxXy8hiFaghq-4aE5sNHdapOqXWsyU9OvIj8f4Yi4";

export const supabase = createClient(supabaseUrl, supabaseKey);

