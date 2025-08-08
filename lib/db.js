import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Cliente para operaciones anónimas (frontend)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Cliente con role de servicio (solo backend - API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
