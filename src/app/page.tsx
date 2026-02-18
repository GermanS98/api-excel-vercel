'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/supabaseClient';
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// --- TYPES ---
type CalendarioEvent = {
  id: number;
  fecha: string;
  pais: string;
  evento: string;
};

type RentaAmortizacion = {
  id: number;
  fecha: string;
  ticker: string;
  emisor: string; // Puede ser null si no está en la db, pero asumimos string por la imagen
  tipo: string;
  frecuencia: string;
  vencimiento: string; // Es texto en la imagen ("2026-02-18")
  renta: string; // Es texto en la imagen ("3.5%") o similar format
  amortizacion: string;
};

// --- HELPER COMPONENTS ---

const SectionHeader = ({ title }: { title: string }) => (
  <h2 style={{
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '1rem',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '0.5rem'
  }}>
    {title}
  </h2>
);

const TableContainer = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    marginBottom: '2rem'
  }}>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        {children}
      </table>
    </div>
  </div>
);

const TableHeader = ({ headers }: { headers: string[] }) => (
  <thead style={{ background: '#021751', color: 'white' }}>
    <tr>
      {headers.map((h, i) => (
        <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>
          {h}
        </th>
      ))}
    </tr>
  </thead>
);

const TableCell = ({ children, align = 'left' }: { children: React.ReactNode, align?: 'left' | 'center' | 'right' }) => (
  <td style={{ padding: '0.75rem 1rem', color: '#4b5563', borderTop: '1px solid #e5e7eb', textAlign: align }}>
    {children}
  </td>
);

const EmptyState = ({ message }: { message: string }) => (
  <tr>
    <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
      {message}
    </td>
  </tr>
);

// --- MAIN PAGE COMPONENT ---

export default function Home() {
  const [events, setEvents] = useState<CalendarioEvent[]>([]);
  const [amortizations, setAmortizations] = useState<RentaAmortizacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        // Obtener inicio y fin de la semana actual (Lunes a Domingo)
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });

        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

        console.log(`Fetching data from ${startStr} to ${endStr}`);

        // 1. Fetch Calendario
        const { data: calendarData, error: calendarError } = await supabase
          .from('calendario')
          .select('*')
          .gte('fecha', startStr)
          .lte('fecha', endStr)
          .order('fecha', { ascending: true });

        if (calendarError) console.error('Error fetching calendario:', calendarError);
        else setEvents(calendarData || []);

        // 2. Fetch Rentas y Amortizaciones
        const { data: rentsData, error: rentsError } = await supabase
          .from('rentasyamort')
          .select('*')
          .gte('fecha', startStr)
          .lte('fecha', endStr)
          .order('fecha', { ascending: true });

        if (rentsError) console.error('Error fetching rentasyamort:', rentsError);
        else setAmortizations(rentsData || []);

      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Formateador de fecha simple
  const formatDate = (dateStr: string) => {
    try {
      // Asumiendo formato YYYY-MM-DD que viene de la DB
      const date = parseISO(dateStr);
      return format(date, 'EEEE dd/MM', { locale: es });
    } catch (e) {
      return dateStr;
    }
  };


  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#021751', marginBottom: '1.5rem' }}>
          Resumen Semanal
        </h1>

        {/* --- SECTION: CALENDARIO --- */}
        <SectionHeader title="Calendario Económico (Esta Semana)" />
        <TableContainer>
          <TableHeader headers={['Fecha', 'País', 'Evento']} />
          <tbody>
            {loading ? (
              <EmptyState message="Cargando calendario..." />
            ) : events.length > 0 ? (
              events.map((evt) => (
                <tr key={evt.id}>
                  <TableCell>{formatDate(evt.fecha)}</TableCell>
                  <TableCell>{evt.pais}</TableCell>
                  <TableCell>{evt.evento}</TableCell>
                </tr>
              ))
            ) : (
              <EmptyState message="No hay eventos programados para esta semana." />
            )}
          </tbody>
        </TableContainer>

        {/* --- SECTION: RENTAS Y AMORTIZACIONES --- */}
        <SectionHeader title="Pagos de Rentas y Amortizaciones (Esta Semana)" />
        <TableContainer>
          {/* Ajustamos headers según la imagen: Fecha, Ticker, Emisor, Tipo, Frecuencia, Vencimiento, Renta, Amortizacion */}
          <TableHeader headers={['Fecha Pago', 'Ticker', 'Emisor', 'Tipo', 'Frecuencia', 'Vencimiento', 'Renta', 'Amortización']} />
          <tbody>
            {loading ? (
              <EmptyState message="Cargando pagos..." />
            ) : amortizations.length > 0 ? (
              amortizations.map((item) => (
                <tr key={item.id}>
                  <TableCell>{formatDate(item.fecha)}</TableCell>
                  <TableCell><strong>{item.ticker}</strong></TableCell>
                  <TableCell>{item.emisor}</TableCell>
                  <TableCell>{item.tipo}</TableCell>
                  <TableCell>{item.frecuencia}</TableCell>
                  <TableCell>{item.vencimiento}</TableCell>
                  <TableCell align="right">{item.renta}</TableCell>
                  <TableCell align="right">{item.amortizacion}</TableCell>
                </tr>
              ))
            ) : (
              <EmptyState message="No hay pagos programados para esta semana." />
            )}
          </tbody>
        </TableContainer>

      </div>
    </Layout>
  );
}
