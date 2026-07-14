import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { MoreHorizontalCircle01Icon } from '@hugeicons/core-free-icons';
import { useMonthlyReport } from '../../application/hooks/useMonthlyReport';
import { useWinLoss } from '../../application/hooks/useWinLoss';
import { ExecutiveSlide } from '../components/ExecutiveSlide';
import { buildAnalysis, money, LABEL_STYLE } from '../components/executive-slide.utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STORAGE_KEY = 'tracker-report-goals';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function loadGoals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as { amount: number; units: number; perSeller: number };
  } catch {
    // Ignore malformed or unavailable persisted preferences and use defaults.
  }
  return null;
}

export function ReportsPage() {
  const search = useSearch({ strict: false }) as {
    month?: string;
    goalAmount?: number;
    goalUnits?: number;
    goalPerSeller?: number;
  };

  const [month, setMonth] = useState<string>(search.month ?? currentMonth());
  const { data, isLoading, error, refetch, dataUpdatedAt } = useMonthlyReport(month);
  const { data: winLoss, isLoading: winLossLoading } = useWinLoss();

  const [goalAmount, setGoalAmount] = useState<number>(search.goalAmount ?? loadGoals()?.amount ?? 600000);
  const [goalUnits, setGoalUnits] = useState<number>(search.goalUnits ?? loadGoals()?.units ?? 150);
  const [goalPerSeller, setGoalPerSeller] = useState<number>(search.goalPerSeller ?? loadGoals()?.perSeller ?? 150000);
  const [savedMsg, setSavedMsg] = useState(false);
  const [copyMsg, setCopyMsg] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [shareLinkMsg, setShareLinkMsg] = useState<'idle' | 'ok' | 'fail'>('idle');
  const updatedAt = dataUpdatedAt > 0
    ? new Date(dataUpdatedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : null;

  function saveGoals() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ amount: goalAmount, units: goalUnits, perSeller: goalPerSeller }),
    );
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  function copyReportText() {
    if (!data) return;
    const ai = buildAnalysis(data, goalAmount, goalUnits, goalPerSeller);
    const sellerSummary = data.sellers
      .map((r) => `${r.sellerName}: ${r.units} unidades, ${money(r.amount)}`)
      .join(' · ');
    const sourceSummary = data.bySource
      .slice(0, 5)
      .map((s) => `${s.source}: ${s.count} cuentas, ${money(s.amount)}`)
      .join(' · ');
    const lines = [
      `Meta vs Logro ${month}: Ventas globales: ${money(data.total.amount)} contra meta de ${money(goalAmount)} (${((data.total.amount / goalAmount) * 100).toFixed(2)}%). Unidades: ${data.total.units} contra meta de ${goalUnits} (${((data.total.units / goalUnits) * 100).toFixed(2)}%).`,
      `Dirección Comercial: ${data.direction.units} unidades por ${money(data.direction.amount)}.`,
      `ATC (Atención a Clientes): ${data.atc.existingUnits} unidades existentes por ${money(data.atc.existingAmount)}.`,
      `Equipo: ${sellerSummary || 'Sin ventas del equipo.'}.`,
      `Origen de cuentas: ${sourceSummary || 'Sin datos.'}.`,
      `Análisis IA: Salud comercial ${ai.health}/100 — ${ai.status}`,
    ];
    navigator.clipboard?.writeText(lines.join('\n'))
      .then(() => { setCopyMsg('ok'); setTimeout(() => setCopyMsg('idle'), 2000); })
      .catch(() => { setCopyMsg('fail'); setTimeout(() => setCopyMsg('idle'), 3000); });
  }

  function shareLink() {
    const params = new URLSearchParams({
      month,
      goalAmount: String(goalAmount),
      goalUnits: String(goalUnits),
      goalPerSeller: String(goalPerSeller),
    });
    const url = `${window.location.origin}/lamina?${params.toString()}`;
    navigator.clipboard?.writeText(url)
      .then(() => { setShareLinkMsg('ok'); setTimeout(() => setShareLinkMsg('idle'), 2000); })
      .catch(() => { setShareLinkMsg('fail'); setTimeout(() => setShareLinkMsg('idle'), 3000); });
  }

  function openLamina() {
    const node = document.getElementById('executive-slide');
    if (!node) { window.print(); return; }
    const win = window.open('', '_blank');
    if (!win) { window.print(); return; }
    win.document.write(
      `<html><head><title>Reporte Ejecutivo — Tracker Sales OS</title>` +
      `<link rel="preconnect" href="https://fonts.googleapis.com">` +
      `<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">` +
      `<style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Montserrat','Inter',sans-serif;background:#EEF2F7;padding:32px;color:#0F172A;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        #executive-slide{max-width:1080px;margin:0 auto}
        @media print{body{background:#fff;padding:0}#executive-slide{border-radius:0!important;border:none!important;box-shadow:none!important}}
      </style>` +
      `</head><body>${node.outerHTML}` +
      `<p style="font-size:11px;color:#94A3B8;margin-top:16px;text-align:center;font-family:sans-serif">Tip: imprime como PDF (Ctrl+P) para compartir o pegar en PowerPoint.</p>` +
      `</body></html>`,
    );
    win.document.close();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Config panel */}
      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Informe Ejecutivo Mensual</div>
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
              Separado por Dirección Comercial, ATC y Equipo de Vendedores.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Mes', width: 150, type: 'month' as const, value: month, onChange: (v: string) => setMonth(v) },
            ].map((f) => (
              <div key={f.label}>
                <label style={{ ...LABEL_STYLE, color: '#94A3B8', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <Input type={f.type} value={f.value} onChange={(e) => f.onChange(e.target.value)} style={{ width: f.width }} />
              </div>
            ))}
            <div>
              <label style={{ ...LABEL_STYLE, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Meta $ equipo</label>
              <Input type="number" style={{ width: 140 }} min={1} value={goalAmount || ''} onChange={(e) => setGoalAmount(Number(e.target.value))} />
            </div>
            <div>
              <label style={{ ...LABEL_STYLE, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Meta unidades</label>
              <Input type="number" style={{ width: 120 }} min={1} value={goalUnits || ''} onChange={(e) => setGoalUnits(Number(e.target.value))} />
            </div>
            <div>
              <label style={{ ...LABEL_STYLE, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Meta $ x vendedor</label>
              <Input type="number" style={{ width: 140 }} min={1} value={goalPerSeller || ''} onChange={(e) => setGoalPerSeller(Number(e.target.value))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Acciones del informe">
                        <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Acciones del informe</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="min-w-48">
                  <DropdownMenuItem onSelect={saveGoals}>
                    {savedMsg ? 'Guardado' : 'Guardar metas'}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={!data} onSelect={copyReportText}>
                    {copyMsg === 'ok' ? 'Copiado' : copyMsg === 'fail' ? 'Error al copiar' : 'Copiar informe'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={shareLink}>
                    {shareLinkMsg === 'ok' ? 'Enlace copiado' : shareLinkMsg === 'fail' ? 'Error al copiar' : 'Compartir informe'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={openLamina}>Abrir lámina</Button>
            </div>
          </div>
        </div>
      </Card>

      {isLoading && <p style={{ fontSize: 13, color: '#94A3B8' }}>Cargando reporte...</p>}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 13, color: '#EF4444' }}>Error al cargar el reporte.</p>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>Reintentar</Button>
        </div>
      )}

      {data && (() => {
        const ai = buildAnalysis(data, goalAmount, goalUnits, goalPerSeller);

        return (
          <>
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

            {/* Detalle Top Vendedores */}
            {data.sellers.length > 0 && (
              <Card style={{ padding: 20 }}>
                <Accordion type="single" collapsible defaultValue="sellers">
                  <AccordionItem value="sellers">
                    <AccordionTrigger>Detalle Top Vendedores</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vendedor</TableHead>
                            <TableHead>Unidades</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>% Meta</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.sellers.map((r) => {
                            const metaPct = goalPerSeller > 0 ? (r.amount / goalPerSeller) * 100 : 0;
                            const metaColor = metaPct >= 100 ? '#4a7c00' : '#B45309';
                            return (
                              <TableRow key={r.sellerId}>
                                <TableCell style={{ fontWeight: 600, color: '#0F172A' }}>{r.sellerName}</TableCell>
                                <TableCell>{r.units}</TableCell>
                                <TableCell style={{ fontWeight: 600 }}>{money(r.amount)}</TableCell>
                                <TableCell>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: metaColor }}>
                                    {metaPct.toFixed(1)}%
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            )}

            {/* Resumen para Dirección */}
            <Card id="executive-report-text" style={{ padding: 20 }}>
              <Accordion type="single" collapsible defaultValue="summary">
                <AccordionItem value="summary">
                  <AccordionTrigger>Resumen para Dirección</AccordionTrigger>
                  <AccordionContent>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: '#475569' }}>
                      <b>Meta vs Logro {month}:</b> Ventas globales: {money(data.total.amount)} contra
                      meta de {money(goalAmount)} ({((data.total.amount / goalAmount) * 100).toFixed(2)}%).
                      Unidades: {data.total.units} contra meta de {goalUnits} ({((data.total.units / goalUnits) * 100).toFixed(2)}%).
                      <br /><br />
                      <b>Dirección Comercial:</b> {data.direction.units} unidades por {money(data.direction.amount)}.
                      <br />
                      <b>ATC:</b> {data.atc.existingUnits} unidades existentes por {money(data.atc.existingAmount)}.
                      {data.sellers.length > 0 && (
                        <>
                          <br />
                          <b>Equipo:</b>{' '}
                          {data.sellers.slice(0, 5).map((r) => `${r.sellerName}: ${r.units} unidades, ${money(r.amount)}`).join(' · ')}.
                        </>
                      )}
                      {data.bySource.length > 0 && (
                        <>
                          <br />
                          <b>Origen de cuentas:</b>{' '}
                          {data.bySource.slice(0, 5).map((s) => `${s.source}: ${s.count} cuentas, ${money(s.amount)}`).join(' · ')}.
                        </>
                      )}
                      <br />
                      <b>Análisis IA:</b> Salud comercial {ai.health}/100 — {ai.status}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </>
        );
      })()}
    </div>
  );
}
