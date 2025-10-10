'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react'; // 1. Importa FormEvent aquí
import { supabase } from '../../supabaseClient';
import styles from './login.module.css'; // 1. Importa los estilos
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
    // 2. Aplica las clases de CSS a tus elementos
    <form onSubmit={handleLogin} className={styles.formContainer}>
      <h1 className={styles.title}>Iniciar Sesión</h1>
      
      <label htmlFor="email" className={styles.label}>Email</label>
      <input
        id="email"
        type="email"
        className={styles.inputField}
        // ... (resto de props)
      />
      
      <label htmlFor="password" className={styles.label}>Contraseña</label>
      <input
        id="password"
        type="password"
        className={styles.inputField}
        // ... (resto de props)
      />
      
      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? 'Cargando...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
