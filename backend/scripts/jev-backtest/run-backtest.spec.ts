import { JevResult } from './jev-client';
import { evaluarLote } from './run-backtest';
import { BatchActivity, Level } from './types';

const UMBRALES = { minFalsos100Detectados: 0.7, maxBuenosDegradados: 0.15 };

const lote: BatchActivity[] = [
  {
    id: 'a1',
    quality: 100,
    franja: 'alta',
    summary: 'visita uno',
    discovery: 'necesidad uno',
    agreement: 'acuerdo uno',
    next_step: 'paso uno',
  },
  {
    id: 'a2',
    quality: 100,
    franja: 'alta',
    summary: 'visita dos',
    discovery: 'necesidad dos',
    agreement: 'acuerdo dos',
    next_step: 'paso dos',
  },
];

const etiquetas = new Map<string, Level | null>([
  ['a1', 1],
  ['a2', 4],
]);

const respuestas: JevResult[] = [
  {
    id: 'a1',
    estado: 'ok',
    nivel: 1,
    distribucion: [0.7, 0.1, 0.1, 0.1],
    confianza: 0.8,
    crudo: { questions: { nivel: { answer: 1 } } },
  },
  {
    id: 'a2',
    estado: 'ok',
    nivel: 4,
    distribucion: null,
    confianza: null,
    crudo: { questions: { nivel: { answer: 4 } } },
  },
];

describe('R8 (77-jev-quality-backtest #77): las respuestas se guardan antes de calcular nada', () => {
  it('guarda lo recibido antes de renderizar el informe', async () => {
    const orden: string[] = [];

    await evaluarLote(lote, etiquetas, UMBRALES, {
      consultar: () => {
        orden.push('consultar');
        return Promise.resolve(respuestas);
      },
      guardarRespuestas: (r) => {
        orden.push('guardar');
        expect(r).toEqual(respuestas);
      },
      guardarInforme: () => {
        orden.push('informe');
      },
    });

    expect(orden).toEqual(['consultar', 'guardar', 'informe']);
  });

  it('si el informe revienta, las 50 llamadas ya estan a salvo en disco', async () => {
    const guardadas: JevResult[] = [];

    await expect(
      evaluarLote(lote, etiquetas, UMBRALES, {
        consultar: () => Promise.resolve(respuestas),
        guardarRespuestas: (r) => {
          guardadas.push(...r);
        },
        guardarInforme: () => {
          throw new TypeError('p.toFixed is not a function');
        },
      }),
    ).rejects.toThrow('toFixed');

    expect(guardadas).toEqual(respuestas);
  });

  it('calcula las metricas sobre la union de etiquetas y respuestas', async () => {
    const metricas = await evaluarLote(lote, etiquetas, UMBRALES, {
      consultar: () => Promise.resolve(respuestas),
      guardarRespuestas: () => undefined,
      guardarInforme: () => undefined,
    });

    expect(metricas.total).toBe(2);
    expect(metricas.sinRespuesta).toBe(0);
    expect(metricas.falsos100.falsos100).toBe(1);
    expect(metricas.falsos100.detectadosPorJev).toBe(1);
  });
});
