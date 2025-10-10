'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { supabase } from '../../supabaseClient';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // <-- 1. Añade esta línea

  const router = useRouter();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); // 2. Usa setLoading para gestionar el estado
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className={styles.formContainer}>
      <h1 className={styles.title}>Iniciar Sesión</h1>
      
      <label htmlFor="email" className={styles.label}>Email</label>
      <input
        id="email"
        type="email"
        className={styles.inputField}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <label htmlFor="password" className={styles.label}>Contraseña</label>
      <input
        id="password"
        type="password"
        className={styles.inputField}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? 'Cargando...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
