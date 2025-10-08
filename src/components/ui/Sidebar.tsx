'use client';

import React from 'react';
import Link from 'next/link';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  items?: { label: string; href: string }[];
  // --- NUEVO: Prop para la función de descarga ---
  onDownloadPDF: () => void; 
};

// --- MODIFICADO: Añadimos onDownloadPDF a las props ---
const Sidebar = ({ isOpen, onClose, items = [], onDownloadPDF }: SidebarProps) => {
  return (
    <>
      {/* Fondo oscuro (sin cambios) */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s',
          pointerEvents: isOpen ? 'auto' : 'none',
          zIndex: 99
        }}
      />
      
      <aside style={{
        position: 'fixed', top: 0, left: 0,
        height: '100%', width: '250px',
        background: '#fff',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out',
        zIndex: 100,
        padding: '20px',
        display: 'flex', flexDirection: 'column'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#021751', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          Menú
        </h2>
        
        <nav style={{ marginTop: '20px', flex: '1' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((item) => {
              const isExternal = item.href.startsWith('http');
              // ... (el resto del mapeo de items no cambia)
              return (
                <li key={item.label} style={{ marginBottom: '8px' }}>
                  {isExternal ? (
                    <a href={item.href} /* ... (resto del enlace sin cambios) */ >{item.label}</a>
                  ) : (
                    <Link href={item.href} /* ... (resto del enlace sin cambios) */ >{item.label}</Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* --- NUEVO: Botón para descargar el reporte completo --- */}
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <button
            onClick={() => {
              onDownloadPDF(); // Llama a la función recibida por props
              onClose(); // Cierra el menú después de hacer clic
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '15px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#16a34a',
              color: 'white',
              fontWeight: '600',
              textAlign: 'center'
            }}
          >
            Descargar Reporte
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;