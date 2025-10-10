'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { FC, ReactNode } from 'react'; // 1. Importa los tipos necesarios

// El tipo que tendrá el valor del contexto
type AuthContextType = {
  session: Session | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

// 2. Define el tipo de las props y úsalo con FC (Functional Component)
export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <p>Cargando...</p>; // Muestra un loader mientras se obtiene la sesión
  }

  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  // La comprobación de null aquí no es estrictamente necesaria si el AuthProvider siempre envuelve la app,
  // pero es una buena práctica para evitar errores.
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
