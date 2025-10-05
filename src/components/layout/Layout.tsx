'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/ui/Sidebar'; // Asegúrate que la ruta sea correcta

// La función 'slugify' también debería estar aquí o en un archivo de utilidades
const slugify = (text: string) => {
  return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};

// Definimos el tipo para las props del Layout
type LayoutProps = {
  children: React.ReactNode; // 'children' es el contenido específico de cada página
};

// Aquí definimos la lista de enlaces UNA SOLA VEZ
    const menuItems = [
    // Enlace para ir al tope de la página
    { label: 'Panel Resumen', href: '/CurvasBonos' },

    // Enlace a una tabla específica en la misma página (usa #)
    { label: 'Renta Fija ARS', href: '/RentaFijaArs'},
    { label: 'CER', href: '/cer'},
    { label: 'Dollar Linked', href: '/dl'},
    { label: 'Obligaciones Negociables', href:'/ons'},
    { label: 'TAMAR', href:'/tamar'},
    { label: 'Bonares y Globales', href:'/soberanosrf'},
    // Enlace a otra página interna de tu sitio
    { label: 'Calculadora', href: '/bonos' },
    ];

const Layout = ({ children }: LayoutProps) => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar 
        isOpen={menuAbierto}
        onClose={() => setMenuAbierto(false)}
        items={menuItems}
      />
  
      <main style={{ 
        background: '#f3f4f6', 
        fontFamily: 'Albert Sans, sans-serif', 
        padding: '10px',
        width: '100%',
      }}>
        {/* Botón para abrir el menú */}
        <button 
          onClick={() => setMenuAbierto(true)}
          style={{
            position: 'fixed', top: '15px', left: '15px', zIndex: 101,
            background: '#fff', border: '1px solid #ddd', borderRadius: '50%',
            width: '40px', height: '40px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M4 12H20M4 18H20" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      
        {/* Aquí se renderizará el contenido de cada página */}
        {children}
      </main>
    </div>
  );
};

export default Layout;