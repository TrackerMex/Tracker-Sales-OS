import {
  JEV_ENDPOINT,
  askJev,
  parseJevResponse,
  runBatch,
} from './jev-client';
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

const opciones = (fetchImpl: jest.Mock, sleep: (ms: number) => Promise<void>) => ({
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

    expect(res).toEqual({
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
    const fetchImpl = jest.fn().mockImplementation((_url, init: RequestInit) => {
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
    expect(res.map((r) => r.estado)).toEqual([
      'ok',
      'sin_respuesta',
      'ok',
    ]);
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
      fetchImpl: fetchImpl as unknown as typeof fetch,
      dryRun: true,
      respuestasEjemplo: [cuerpoOk(2)],
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(res[0].nivel).toBe(2);
  });
});
