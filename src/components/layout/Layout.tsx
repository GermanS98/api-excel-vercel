'use client';

import React, { useState } from 'react';  
import Sidebar from '@/components/ui/Sidebar'; // Asegúrate que la ruta sea correcta

// --- CORREGIDO: Definimos el tipo para las props en un solo lugar ---
// Añadimos 'onDownloadPDF' y la hacemos opcional por si algún layout no la necesita.
type LayoutProps = {
  children: React.ReactNode;
  onDownloadPDF?: () => void; // La función que viene de HomePage
};

const Layout = ({ children, onDownloadPDF }: LayoutProps) => {
  // --- CORREGIDO: Usamos un solo nombre para el estado ---
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // --- CORREGIDO: Definimos la lista de enlaces una sola vez ---
  // Usé la lista más completa que tenías.
  const menuItems = [
    { label: 'Panel Resumen', href: '/CurvasBonos' },
    { label: 'Renta Fija ARS', href: '/RentaFijaArs'},
    { label: 'CER', href: '/cer'},
    { label: 'Dollar Linked', href: '/dl'},
    { label: 'Obligaciones Negociables', href:'/ons'},
    { label: 'TAMAR', href:'/tamar'},
    { label: 'Bonares y Globales', href:'/soberanosrf'},
    { label: 'Calculadora', href: '/bonos' },
  ];

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar 
        isOpen={isSidebarOpen} // Usamos la variable de estado correcta
        onClose={() => setSidebarOpen(false)} // Usamos la función correcta
        items={menuItems}
        onDownloadPDF={onDownloadPDF || (() => {})} // Pasamos la prop correctamente
      />
 
      <main style={{ 
        background: '#fff', 
        fontFamily: 'Albert Sans, sans-serif', 
        padding: '10px',
        width: '100%',
      }}>
        {/* Botón para abrir el menú */}
        <button 
          onClick={() => setSidebarOpen(true)} // Usamos la función correcta
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