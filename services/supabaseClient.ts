import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xdvdplvfqtspbffiyvfa.supabase.co';
// Updated to the correct Supabase Anon Key provided by the project owner.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdmRwbHZmcXRzcGJmZml5dmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzI0MTgsImV4cCI6MjA4NjA0ODQxOH0.7pweKmdAeQtzIKEJv6Z2jaPxk4irkGTqnHwKmHefCiU';

export const supabase = createClient(supabaseUrl, supabaseKey);