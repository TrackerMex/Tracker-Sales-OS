import { useSearch } from '@tanstack/react-router';
import { useMonthlyReport } from '../../application/hooks/useMonthlyReport';
import { useWinLoss } from '../../application/hooks/useWinLoss';
import { ExecutiveSlide } from '../components/ExecutiveSlide';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function LaminaPage() {
  const search = useSearch({ strict: false }) as {
    month?: string;
    goalAmount?: number;
    goalUnits?: number;
    goalPerSeller?: number;
  };

  const month = search.month ?? currentMonth();
  const goalAmount = search.goalAmount ?? 600000;
  const goalUnits = search.goalUnits ?? 150;
  const goalPerSeller = search.goalPerSeller ?? 150000;

  const { data, isLoading, error, dataUpdatedAt } = useMonthlyReport(month);
  const { data: winLoss, isLoading: winLossLoading } = useWinLoss();

  const updatedAt = dataUpdatedAt > 0
    ? new Date(dataUpdatedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#EEF2F7',
      padding: '32px',
      fontFamily: "'Montserrat','Inter',sans-serif",
    }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {isLoading && (
          <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingTop: 60 }}>
            Cargando reporte...
          </p>
        )}
        {error && (
          <p style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', paddingTop: 60 }}>
            Error al cargar el reporte. Verifica que tengas acceso.
          </p>
        )}
        {data && (
          <ExecutiveSlide
            data={data}
            winLoss={winLoss}
            winLossLoading={winLossLoading}
            goalAmount={goalAmount}
            goalUnits={goalUnits}
            goalPerSeller={goalPerSeller}
            month={month}
            updatedAt={updatedAt}
          />
        )}
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 16, textAlign: 'center' }}>
          Tracker Sales OS — Reporte Ejecutivo {month}
        </p>
      </div>
    </div>
  );
}
