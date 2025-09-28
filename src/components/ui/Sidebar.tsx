// En: components/ui/Sidebar.tsx

'use client';

import React from 'react';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
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
      
      {/* El menú lateral */}
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
        
        <p style={{ color: '#6b7280', marginTop: '20px', fontStyle: 'italic' }}>
          (Contenido del menú próximamente)
        </p>

      </aside>
    </>
  );
};

export default Sidebar;