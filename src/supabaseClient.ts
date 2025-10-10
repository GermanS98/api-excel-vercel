import { createClient } from '@supabase/supabase-js'

// Usamos los nombres exactos de tus variables en Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY; // <-- Nombre ajustado

// Verificación de seguridad para asegurar que las variables existan
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Error: Revisa tus variables de entorno en Vercel. Faltan URL o Key.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
