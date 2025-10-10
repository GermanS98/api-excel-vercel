'use client';

import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type FC, type ReactNode } from 'react';

// Define aquí las rutas que NO necesitan autenticación.
// Si tienes una página de registro, añádela aquí: ['/login', '/signup']
const publicRoutes = ['/login'];

// Definimos los tipos para las props del componente
interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard: FC<AuthGuardProps> = ({ children }) => {
  const { session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Caso 1: El usuario NO está logueado y la página NO es pública.
    // Lo mandamos al login.
    if (!session && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }

    // Caso 2: El usuario SÍ está logueado y está intentando acceder a una página pública (como el login).
    // Lo mandamos al dashboard para que no vea el login de nuevo.
    if (session && publicRoutes.includes(pathname)) {
      router.push('/dashboard'); // O a la página principal de tu app
    }
  }, [session, pathname, router]);

  // Mientras se determina la sesión y se redirige, muestra un mensaje.
  // Esto evita que se vea un parpadeo de la página protegida.
  if (!session && !publicRoutes.includes(pathname)) {
    return <p>Cargando...</p>;
  }

  // Si todo está en orden, muestra el contenido de la página.
  return <>{children}</>;
};

export default AuthGuard;
