import { JEV_ENDPOINT, askJev, parseJevResponse, runBatch } from './jev-client';
import { SourceActivity } from './types';

const actividad = (id: string): SourceActivity => ({
  id,
  quality: 100,
  summary: `resumen ${id}`,
  discovery: `descubrimiento ${id}`,
  agreement: `acuerdo ${id}`,
  next_step: `siguiente paso ${id}`,
});

const cuerpoOk = (nivel: number) => ({
  questions: {
    nivel: {
      answer: nivel,
      probabilities: [0.05, 0.1, 0.15, 0.7],
      confidence: 0.82,
    },
  },
});

const respuesta = (status: number, cuerpo: unknown = {}) => ({
  status,
  ok: status >= 200 && status < 300,
  json: () => Promise.resolve(cuerpo),
});

const conEsperas = () => {
  const esperas: number[] = [];
  return {
    esperas,
    sleep: (ms: number) => {
      esperas.push(ms);
      return Promise.resolve();
    },
  };
};

const opciones = (
  fetchImpl: jest.Mock,
  sleep: (ms: number) => Promise<void>,
) => ({
  fetchImpl: fetchImpl as unknown as typeof fetch,
  apiKey: 'clave-de-prueba',
  sleep,
});

describe('R8 (77-jev-quality-backtest #77): consulta al modelo', () => {
  it('llama al endpoint de TypeSafe con la clave en la cabecera', async () => {
    const { sleep } = conEsperas();
    const fetchImpl = jest.fn().mockResolvedValue(respuesta(200, cuerpoOk(4)));

    await askJev(actividad('a1'), opciones(fetchImpl, sleep));

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(JEV_ENDPOINT);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer clave-de-prueba',
    );
  });

  it('guarda el nivel, la distribucion de probabilidades y la confianza', async () => {
    const { sleep } = conEsperas();
    const fetchImpl = jest.fn().mockResolvedValue(respuesta(200, cuerpoOk(3)));

    const res = await askJev(actividad('a1'), opciones(fetchImpl, sleep));

    expect(res).toMatchObject({
      id: 'a1',
      estado: 'ok',
      nivel: 3,
      distribucion: [0.05, 0.1, 0.15, 0.7],
      confianza: 0.82,
    });
  });

  it('acepta que el modelo devuelva el criterio en texto en vez del indice', () => {
    const parseado = parseJevResponse({
      questions: {
        nivel: {
          answer: 'hay compromiso del cliente pero sin fecha ni responsable',
          confidence: 0.5,
        },
      },
    });

    expect(parseado?.nivel).toBe(3);
  });

  it('devuelve null cuando la respuesta no tiene la forma esperada', () => {
    expect(parseJevResponse({ otra: 'cosa' })).toBeNull();
  });
});

describe('R9 (77-jev-quality-backtest #77): reintentos con espera exponencial', () => {
  it('reintenta 429 hasta tres veces y luego marca sin_respuesta', async () => {
    const { esperas, sleep } = conEsperas();
    const fetchImpl = jest.fn().mockResolvedValue(respuesta(429));

    const res = await askJev(actividad('a1'), opciones(fetchImpl, sleep));

    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(esperas).toEqual([1000, 2000, 4000]);
    expect(res.estado).toBe('sin_respuesta');
    expect(res.nivel).toBeNull();
  });

  it('reintenta 529 y se queda con la respuesta buena si llega', async () => {
    const { esperas, sleep } = conEsperas();
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(respuesta(529))
      .mockResolvedValueOnce(respuesta(529))
      .mockResolvedValue(respuesta(200, cuerpoOk(2)));

    const res = await askJev(actividad('a1'), opciones(fetchImpl, sleep));

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(esperas).toEqual([1000, 2000]);
    expect(res.estado).toBe('ok');
    expect(res.nivel).toBe(2);
  });

  it('no reintenta un error que no es 429 ni 529', async () => {
    const { esperas, sleep } = conEsperas();
    const fetchImpl = jest.fn().mockResolvedValue(respuesta(500));

    const res = await askJev(actividad('a1'), opciones(fetchImpl, sleep));

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(esperas).toEqual([]);
    expect(res.estado).toBe('sin_respuesta');
  });

  it('el lote continua cuando una actividad agota los reintentos', async () => {
    const { sleep } = conEsperas();
    const fetchImpl = jest
      .fn()
      .mockImplementation((_url, init: RequestInit) => {
        const cuerpo = JSON.parse(init.body as string) as {
          state: { summary: string };
        };
        return Promise.resolve(
          cuerpo.state.summary.includes('a2')
            ? respuesta(429)
            : respuesta(200, cuerpoOk(4)),
        );
      });

    const res = await runBatch(
      [actividad('a1'), actividad('a2'), actividad('a3')],
      opciones(fetchImpl, sleep),
    );

    expect(res.map((r) => r.id)).toEqual(['a1', 'a2', 'a3']);
    expect(res.map((r) => r.estado)).toEqual(['ok', 'sin_respuesta', 'ok']);
  });
});

describe('R10 (77-jev-quality-backtest #77): modo seco', () => {
  it('con dry-run no abre ninguna conexion de red', async () => {
    const { sleep } = conEsperas();
    const fetchImpl = jest.fn();

    const res = await runBatch([actividad('a1'), actividad('a2')], {
      ...opciones(fetchImpl, sleep),
      dryRun: true,
      respuestasEjemplo: [cuerpoOk(1), cuerpoOk(4)],
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(res.map((r) => r.nivel)).toEqual([1, 4]);
    expect(res.map((r) => r.estado)).toEqual(['ok', 'ok']);
  });

  it('con dry-run tampoco hace falta clave de API', async () => {
    const fetchImpl = jest.fn();

    const res = await runBatch([actividad('a1')], {
      fetchImpl: fetchImpl,
      dryRun: true,
      respuestasEjemplo: [cuerpoOk(2)],
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(res[0].nivel).toBe(2);
  });
});

describe('R8 (77-jev-quality-backtest #77): un nivel que no es 1, 2, 3 o 4 no se inventa', () => {
  it('rechaza un answer fraccionario, que corromperia la matriz de R11', () => {
    expect(
      parseJevResponse({ questions: { nivel: { answer: 2.5 } } }),
    ).toBeNull();
    expect(
      parseJevResponse({ questions: { nivel: { answer: '2.5' } } }),
    ).toBeNull();
  });

  it('rechaza un answer fuera de la escala', () => {
    for (const answer of [0, 5, -1, '0', '5']) {
      expect(parseJevResponse({ questions: { nivel: { answer } } })).toBeNull();
    }
  });

  it('sigue aceptando los cuatro niveles enteros, en numero y en cadena', () => {
    for (const [answer, esperado] of [
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
      ['1', 1],
      ['4', 4],
    ] as [number | string, number][]) {
      expect(parseJevResponse({ questions: { nivel: { answer } } })?.nivel).toBe(
        esperado,
      );
    }
  });

  it('la actividad queda sin_respuesta, no con un nivel fraccionario', async () => {
    const { sleep } = conEsperas();
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(
        respuesta(200, { questions: { nivel: { answer: 2.5 } } }),
      );

    const res = await askJev(actividad('a1'), opciones(fetchImpl, sleep));

    expect(res.estado).toBe('sin_respuesta');
    expect(res.nivel).toBeNull();
    expect(res.motivo).toContain('forma esperada');
  });
});

describe('R8 (77-jev-quality-backtest #77): distribucion de probabilidades no fiable', () => {
  it('acepta una distribucion de numeros finitos', () => {
    const p = parseJevResponse({
      questions: { nivel: { answer: 3, probabilities: [0.1, 0.2, 0.6, 0.1] } },
    });

    expect(p?.distribucion).toEqual([0.1, 0.2, 0.6, 0.1]);
  });

  it('descarta la distribucion si algun elemento no es un numero, sin perder el nivel', () => {
    const p = parseJevResponse({
      questions: {
        nivel: { answer: 3, probabilities: ['0.7', '0.1', '0.1', '0.1'] },
      },
    });

    expect(p?.nivel).toBe(3);
    expect(p?.distribucion).toBeNull();
  });

  it('descarta tambien NaN, Infinity y null dentro del array', () => {
    for (const probabilities of [
      [0.5, NaN, 0.3, 0.2],
      [0.5, Infinity, 0.3, 0.2],
      [0.5, null, 0.3, 0.2],
      [0.5, {}, 0.3, 0.2],
    ]) {
      const p = parseJevResponse({
        questions: { nivel: { answer: 2, probabilities } },
      });
      expect(p?.nivel).toBe(2);
      expect(p?.distribucion).toBeNull();
    }
  });
});

describe('R10 (77-jev-quality-backtest #77): retomar el lote sin volver a llamar a la API', () => {
  it('guarda la respuesta cruda junto al resultado', async () => {
    const { sleep } = conEsperas();
    const fetchImpl = jest.fn().mockResolvedValue(respuesta(200, cuerpoOk(3)));

    const res = await askJev(actividad('a1'), opciones(fetchImpl, sleep));

    expect(res.crudo).toEqual(cuerpoOk(3));
  });

  it('reparse reconstruye los resultados desde lo guardado, sin red', () => {
    const rehecho = reparse([
      { id: 'a1', crudo: cuerpoOk(4) },
      { id: 'a2', motivo: 'HTTP 500' },
      { id: 'a3', crudo: { basura: true } },
    ]);

    expect(rehecho).toEqual([
      {
        id: 'a1',
        estado: 'ok',
        nivel: 4,
        distribucion: [0.05, 0.1, 0.15, 0.7],
        confianza: 0.82,
        crudo: cuerpoOk(4),
      },
      {
        id: 'a2',
        estado: 'sin_respuesta',
        nivel: null,
        distribucion: null,
        confianza: null,
        motivo: 'HTTP 500',
      },
      {
        id: 'a3',
        estado: 'sin_respuesta',
        nivel: null,
        distribucion: null,
        confianza: null,
        motivo: 'respuesta sin la forma esperada',
        crudo: { basura: true },
      },
    ]);
  });
});
