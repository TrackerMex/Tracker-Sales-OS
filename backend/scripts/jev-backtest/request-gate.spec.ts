import {
  QUESTION_KEY,
  buildRequestBody,
  recortarCampos,
  requireApproval,
} from './jev-client';
import { main } from './run-backtest';
import { LEVELS, SourceActivity } from './types';

const actividad: SourceActivity = {
  id: '9f1c3b7e-0000-4000-8000-000000000001',
  quality: 100,
  seller_id: 'VENDEDOR-UUID-7f3a',
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

    const codigo = await main(
      ['--fase', 'evaluar'],
      {},
      {
        fetchImpl: fetchSpy as unknown as typeof fetch,
      },
    );

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
    const cuerpo = buildRequestBody(recortarCampos(actividad));

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

    const serializado = JSON.stringify(buildRequestBody(recortarCampos(fila)));

    for (const fuera of [
      actividad.id,
      'VENDEDOR-UUID-7f3a',
      'VENDEDOR-123',
      'seller_id',
      'CLIENTE-456',
      '87500',
      '2026-03-04',
      'quality',
    ]) {
      expect(serializado).not.toContain(fuera);
    }
  });

  it('pregunta al modelo con una sola pregunta score y los criterios de R7 en orden', () => {
    const cuerpo = buildRequestBody(recortarCampos(actividad));

    expect(cuerpo.model).toBe('jev-latest');
    expect(Object.keys(cuerpo.questions)).toEqual([QUESTION_KEY]);
    expect(cuerpo.questions[QUESTION_KEY].type).toBe('score');
    expect(cuerpo.questions[QUESTION_KEY].criteria).toEqual([...LEVELS]);
  });

  it('manda cadena vacia cuando el campo viene a NULL, no la clave fuera', () => {
    const cuerpo = buildRequestBody(
      recortarCampos({ ...actividad, discovery: null }),
    );

    expect(cuerpo.state.discovery).toBe('');
    expect(Object.keys(cuerpo.state)).toHaveLength(4);
  });
});

describe('R5 (77-jev-quality-backtest #77): el recorte ocurre una vez y tiene nombre', () => {
  const fila = {
    ...actividad,
    seller_id: 'VENDEDOR-UUID-7f3a',
    client_id: 'CLIENTE-456',
    amount: 87500,
    executed_at: '2026-03-04T10:00:00Z',
  };

  it('se queda con los cuatro campos de texto y con nada mas', () => {
    expect(Object.keys(recortarCampos(fila)).sort()).toEqual([
      'agreement',
      'discovery',
      'next_step',
      'summary',
    ]);
  });

  it('nada de lo que no es texto sobrevive al recorte', () => {
    const recortado = JSON.stringify(recortarCampos(fila));

    for (const fuera of [
      actividad.id,
      'VENDEDOR-UUID-7f3a',
      'CLIENTE-456',
      '87500',
      '2026-03-04',
    ]) {
      expect(recortado).not.toContain(fuera);
    }
  });

  it('normaliza a cadena vacia el campo que viene a NULL', () => {
    expect(recortarCampos({ ...actividad, discovery: null }).discovery).toBe(
      '',
    );
  });
});

describe('R5 (77-jev-quality-backtest #77): la frontera la sostiene el compilador', () => {
  // Estas dos comprobaciones las hace `npx tsc --noEmit`, no jest: ts-jest
  // corre en modo transpilacion y no mira tipos. Si algun dia la fila completa
  // vuelve a encajar en el constructor de la peticion, la directiva de error
  // esperado se queda sin usar y tsc falla. Es la capa que protege de quien
  // anada un campo nuevo aguas arriba dentro de seis meses; los tests de lo
  // que sale por el cable siguen cubriendo el resto.
  it('la fila de la base no encaja donde va el texto recortado', () => {
    // @ts-expect-error lleva id, quality y seller_id encima de los cuatro campos
    buildRequestBody(actividad);

    const conVendedorDeMas = {
      ...recortarCampos(actividad),
      seller_id: 'VENDEDOR-UUID-7f3a',
    };
    // @ts-expect-error un solo campo de sobra basta para que no compile
    buildRequestBody(conVendedorDeMas);

    expect(Object.keys(recortarCampos(actividad))).toHaveLength(4);
  });
});
