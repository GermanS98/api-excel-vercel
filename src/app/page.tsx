'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/supabaseClient';
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// New Components
import TradingViewCalendar from '@/components/ui/TradingViewCalendar';
import TradingViewNews from '@/components/ui/TradingViewNews';
import FinvizTable from '@/components/ui/FinvizTable';
import YahooNews from '@/components/ui/YahooNews';

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
  emisor: string;
  tipo: string;
  frecuencia: string;
  vencimiento: string;
  renta: string;
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
        <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>
          {h}
        </th>
      ))}
    </tr>
  </thead>
);

const TableCell = ({ children, align = 'center' }: { children: React.ReactNode, align?: 'left' | 'center' | 'right' }) => (
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
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });

        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

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

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'EEEE dd/MM', { locale: es });
    } catch (e) {
      return dateStr;
    }
  };

  const formatPercentage = (value: string) => {
    if (!value) return '-';
    if (value.includes('%')) return value;
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    const percentage = num * 100;
    return `${percentage.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  };


  return (
    <Layout>
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1rem' }}>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#021751', marginBottom: '1.5rem' }}>
          Principales Eventos
        </h1>

        {/* --- DATOS SUPABASE (LOCAL) - CALENDARIO --- */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHeader title="Principales Eventos" />
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
        </div>

        {/* --- GRID DE WIDGETS (TradingView) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
          <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
            <TradingViewCalendar />
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
            <TradingViewNews />
          </div>
        </div>

        {/* --- YAHOO FINANCE NEWS (tabla completa) --- */}
        <YahooNews />

        {/* --- FINVIZ NEWS (tabla completa) --- */}
        <FinvizTable />

        {/* --- SECTION: RENTAS Y AMORTIZACIONES (MOVED TO BOTTOM) --- */}
        <div style={{ marginTop: '2rem' }}>
          <SectionHeader title="Pagos de Rentas y Amortizaciones" />
          <TableContainer>
            <TableHeader headers={['Fecha', 'Ticker', 'Emisor', 'Tipo', 'Frec', 'Vto', 'Renta', 'Amort']} />
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
                    <TableCell align="center">{formatPercentage(item.renta)}</TableCell>
                    <TableCell align="center">{formatPercentage(item.amortizacion)}</TableCell>
                  </tr>
                ))
              ) : (
                <EmptyState message="No hay pagos programados para esta semana." />
              )}
            </tbody>
          </TableContainer>
        </div>

      </div>
    </Layout>
  );
}
