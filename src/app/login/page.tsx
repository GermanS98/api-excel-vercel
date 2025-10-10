'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react'; // 1. Importa FormEvent aquí
import { supabase } from '../../supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // 2. Añade el tipo al parámetro 'e'
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      router.push('/dashboard'); // O a tu página principal
    } else {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
}
