
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xdvdplvfqtspbffiyvfa.supabase.co';
// Reverted to the correct Supabase Anon Key provided by the project owner.
const supabaseKey = 'sb_publishable_0NjuxUh30hzkTuxQY50uqQ_NvJ1sSjG';

export const supabase = createClient(supabaseUrl, supabaseKey);
