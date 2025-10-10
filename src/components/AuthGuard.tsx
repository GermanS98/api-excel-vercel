'use client';

import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const publicRoutes = ['/login']; // Rutas públicas

export default function AuthGuard({ children }) {
  const { session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!session && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }
    if (session && publicRoutes.includes(pathname)) {
      router.push('/dashboard'); // O a tu página principal
    }
  }, [session, pathname, router]);

  if (!session && !publicRoutes.includes(pathname)) {
    return <p>Cargando...</p>;
  }

  return <>{children}</>;
}
  return <>{children}</>;
};

export default AuthGuard;
