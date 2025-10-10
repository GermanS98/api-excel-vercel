'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
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
      {/* Inputs para email y password */}
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
}
