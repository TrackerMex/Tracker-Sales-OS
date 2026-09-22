import {
  QUESTION_KEY,
  buildRequestBody,
  requireApproval,
} from './jev-client';
import { main } from './run-backtest';
import { LEVELS, SourceActivity } from './types';

const actividad: SourceActivity = {
  id: '9f1c3b7e-0000-4000-8000-000000000001',
  quality: 100,
  summary: 'visita de seguimiento en planta',
  discovery: 'necesita entrega quincenal',
  agreement: 'revisa la cotizacion el jueves',
  next_step: 'enviar propuesta firmada',
};

describe('R4 (77-jev-quality-backtest #77): aprobacion humana antes de salir de la empresa', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sin JEV_BACKTEST_APPROVED el script sale con codigo distinto de cero y no construye ninguna peticion', async () => {
    const fetchSpy = jest.fn();

    const codigo = await main(['--fase', 'evaluar'], {}, {
      fetchImpl: fetchSpy as unknown as typeof fetch,
    });

    expect(codigo).not.toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('requireApproval falla sin la variable y pasa con ella', () => {
    expect(() => requireApproval({})).toThrow(/JEV_BACKTEST_APPROVED/);
    expect(() =>
      requireApproval({ JEV_BACKTEST_APPROVED: 'si' }),
    ).not.toThrow();
  });
});

describe('R5 (77-jev-quality-backtest #77): solo viajan los cuatro campos de texto', () => {
  it('el cuerpo tiene exactamente los cuatro campos de texto y ninguna otra clave', () => {
    const cuerpo = buildRequestBody(actividad);

    expect(Object.keys(cuerpo.state).sort()).toEqual([
      'agreement',
      'discovery',
      'next_step',
      'summary',
    ]);
    expect(Object.keys(cuerpo).sort()).toEqual(['model', 'questions', 'state']);
  });

  it('no arrastra id, vendedor, cliente, importes ni fechas aunque vengan en la fila', () => {
    const fila = {
      ...actividad,
      seller_id: 'VENDEDOR-123',
      client_id: 'CLIENTE-456',
      amount: 87500,
      executed_at: '2026-03-04T10:00:00Z',
    };

    const serializado = JSON.stringify(buildRequestBody(fila));

    for (const fuera of [
      actividad.id,
      'VENDEDOR-123',
      'CLIENTE-456',
      '87500',
      '2026-03-04',
      'quality',
    ]) {
      expect(serializado).not.toContain(fuera);
    }
  });

  it('pregunta al modelo con una sola pregunta score y los criterios de R7 en orden', () => {
    const cuerpo = buildRequestBody(actividad);

    expect(cuerpo.model).toBe('jev-latest');
    expect(Object.keys(cuerpo.questions)).toEqual([QUESTION_KEY]);
    expect(cuerpo.questions[QUESTION_KEY].type).toBe('score');
    expect(cuerpo.questions[QUESTION_KEY].criteria).toEqual([...LEVELS]);
  });

  it('manda cadena vacia cuando el campo viene a NULL, no la clave fuera', () => {
    const cuerpo = buildRequestBody({ ...actividad, discovery: null });

    expect(cuerpo.state.discovery).toBe('');
    expect(Object.keys(cuerpo.state)).toHaveLength(4);
  });
});
