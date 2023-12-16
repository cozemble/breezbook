
import {createClient} from '@supabase/supabase-js';
import {mandatory} from "./utils.js";

const supabaseUrl = mandatory(process.env.SUPABASE_URL, 'No SUPABASE_URL in environment');
const supabaseKey = mandatory(process.env.SUPABASE_KEY, 'No SUPABASE_KEY in environment');
export const supabaseClient = createClient(supabaseUrl, supabaseKey);
