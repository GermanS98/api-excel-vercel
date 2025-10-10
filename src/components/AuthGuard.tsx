'use client';

import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type FC, type ReactNode } from 'react';

const publicRoutes = ['/login'];

interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard: FC<AuthGuardProps> = ({ children }) => {
  // 1. Obtén el contexto completo primero
  const authContext = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 2. Si el contexto aún no está disponible, muestra un estado de carga
  if (!authContext) {
    return <p>Cargando sesión...</p>;
  }

  // 3. Ahora puedes desestructurar la sesión de forma segura
  const { session } = authContext;

  useEffect(() => {
    if (!session && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }
    if (session && publicRoutes.includes(pathname)) {
      router.push('/dashboard');
    }
  }, [session, pathname, router]);

  if (!session && !publicRoutes.includes(pathname)) {
    return <p>Cargando...</p>;
  }

  return <>{children}</>;
};

export default AuthGuard;
