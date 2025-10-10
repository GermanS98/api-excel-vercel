'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '../../supabaseClient';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) throw error;
      
      // ¡Importante! Avisa al usuario que debe confirmar su email.
      alert('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
      router.push('/login'); // Redirige al login después del registro

    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp}>
      <h1>Crear una cuenta</h1>
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
      <button type="submit" disabled={loading}>
        {loading ? 'Registrando...' : 'Registrarse'}
      </button>
    </form>
  );
}
