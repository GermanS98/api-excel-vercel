'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Asegúrate que la ruta sea correcta
import type { Session } from '@supabase/supabase-js';
import type { FC, ReactNode } from 'react';

// Creamos un tipo para el valor del contexto
type AuthContextType = {
  session: Session | null;
};

// Creamos el contexto con un valor inicial de null
const AuthContext = createContext<AuthContextType | null>(null);

// Creamos el componente Proveedor del contexto
export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtenemos la sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuchamos cambios en la autenticación (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Limpiamos la suscripción al desmontar el componente
    return () => subscription.unsubscribe();
  }, []);

  // Mientras carga la sesión, puedes mostrar un spinner o nada
  if (loading) {
    return null; 
  }

  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  );
};

// Creamos un hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
