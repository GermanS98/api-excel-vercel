'use client';

import React from 'react';
import Link from 'next/link'; // Importamos el componente Link de Next.js

// 1. Agregamos la prop 'items' para recibir los enlaces del menú
type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  items?: { label: string; href: string }[]; // 'items' es un array opcional
};

const Sidebar = ({ isOpen, onClose, items = [] }: SidebarProps) => {
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
      
      {/* El menú lateral (con contenido dinámico) */}
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
        {/* Título (sin cambios) */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#021751', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          Menú
        </h2>
        
        {/* 2. Reemplazamos el párrafo con la lista de enlaces */}
        <nav style={{ marginTop: '20px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((item) => {
              const isExternal = item.href.startsWith('http');

              return (
                <li key={item.label} style={{ marginBottom: '8px' }}>
                  {isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClose}
                      style={{
                        textDecoration: 'none', color: '#374151', display: 'block',
                        padding: '10px 15px', borderRadius: '6px',
                        transition: 'background-color 0.2s, color 0.2s',
                        fontWeight: 500
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#1036E2'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#374151'; }}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      style={{
                        textDecoration: 'none', color: '#374151', display: 'block',
                        padding: '10px 15px', borderRadius: '6px',
                        transition: 'background-color 0.2s, color 0.2s',
                        fontWeight: 500
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#1036E2'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#374151'; }}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;