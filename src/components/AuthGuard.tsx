'use client';

import { useAuth } from '../context/AuthContext'; // Importa el hook que creamos
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type FC, type ReactNode } from 'react';

// Define aquí las rutas que no necesitan autenticación
const publicRoutes = ['/login', '/signup'];

interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard: FC<AuthGuardProps> = ({ children }) => {
  const { session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si no hay sesión y la ruta actual NO es pública, redirige al login
    if (!session && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }

    // Si SÍ hay sesión y el usuario intenta ir al login, redirígelo al dashboard
    if (session && publicRoutes.includes(pathname)) {
      router.push('/dashboard'); // O a la página principal de tu app
    }
  }, [session, pathname, router]);

  // Muestra el contenido solo si se cumplen las condiciones
  // O si la sesión está cargando (para evitar parpadeos)
  if (!session && !publicRoutes.includes(pathname)) {
    // Puedes mostrar un spinner de carga aquí mientras redirige
    return <p>Cargando...</p>;
  }

  return <>{children}</>;
};

export default AuthGuard;
