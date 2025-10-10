// src/app/login/page.tsx

'use client'; // 1. ¡MUY IMPORTANTE! Indica que es un Componente de Cliente

import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { supabase } from '../../supabaseClient'; // 2. Ajusta la ruta a tu cliente

const LoginPage: FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      
      alert('¡Inicio de sesión exitoso!');
      // Idealmente, aquí rediriges al usuario al dashboard
      // Por ejemplo, usando el router de Next.js: router.push('/dashboard')

    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '96px auto' }}>
      <h1>Iniciar Sesión</h1>
      <form onSubmit={handleLogin}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
        />
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Cargando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
