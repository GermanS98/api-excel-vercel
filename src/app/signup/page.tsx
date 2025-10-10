'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '../../supabaseClient';
import { useRouter } from 'next/navigation';
import styles from '../login/login.module.css'; // 1. Importa los estilos desde la carpeta de login

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

      alert('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
      router.push('/login');

    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // 2. Aplica las clases a tus elementos JSX
    <form onSubmit={handleSignUp} className={styles.formContainer}>
      <h1 className={styles.title}>Crear una cuenta</h1>
      
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
        {loading ? 'Registrando...' : 'Registrarse'}
      </button>
    </form>
  );
}
