// En: components/ui/Sidebar.tsx

'use client';

import React from 'react';

// Función para generar URLs/IDs (la misma que antes)
const slugify = (text: string) => {
  return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};

type SidebarProps = {
  isOpen: boolean;
  segmentos: string[];
  onClose: () => void;
};

const Sidebar = ({ isOpen, segmentos, onClose }: SidebarProps) => {
  return (
    <>
      {/* Fondo oscuro cuando el menú está abierto (en móviles) */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s',
          pointerEvents: isOpen ? 'auto' : 'none',
          zIndex: 99
        }}
      />
      
      {/* El menú lateral */}
      <aside style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        width: '250px',
        background: '#fff',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out',
        zIndex: 100,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#021751', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Segmentos</h2>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0' }}>
            {segmentos.map(segmento => (
              <li key={segmento} style={{ marginBottom: '10px' }}>
                <a 
                  href={`#${slugify(segmento)}`}
                  onClick={onClose} // Cierra el menú al hacer clic
                  style={{ 
                    textDecoration: 'none', 
                    color: '#374151',
                    fontSize: '1rem',
                    display: 'block',
                    padding: '8px',
                    borderRadius: '6px'
                  }}
                  // Efecto hover simple
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {segmento}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;