'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient'; // Asegúrate que la ruta sea correcta

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  items?: { label: string; href: string }[];
  onDownloadPDF: () => void;
};

const Sidebar = ({ isOpen, onClose, items = [], onDownloadPDF }: SidebarProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Fondo oscuro */}
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
          {/* --- SECCIÓN DE ENLACES RESTAURADA --- */}
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

        {/* Botones de acción al final */}
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <button
            onClick={() => {
              onDownloadPDF();
              onClose();
            }}
            style={{
              width: '100%', padding: '12px 16px', fontSize: '15px',
              cursor: 'pointer', borderRadius: '8px', border: 'none',
              backgroundColor: '#16a34a', color: 'white', fontWeight: '600',
              textAlign: 'center'
            }}
          >
            Descargar Reporte
          </button>
          
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '12px 16px', fontSize: '15px',
              cursor: 'pointer', borderRadius: '8px', border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb', color: '#374151', fontWeight: '600',
              textAlign: 'center',
              marginTop: '10px'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
