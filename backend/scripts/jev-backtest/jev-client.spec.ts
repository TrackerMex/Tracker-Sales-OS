import {
  JEV_ENDPOINT,
  JevResult,
  askJev,
  necesitaLlamada,
  parseJevResponse,
  reparse,
  runBatch,
} from './jev-client';
import { SourceActivity } from './types';

const actividad = (id: string): SourceActivity => ({
  id,
  quality: 100,
  seller_id: 'VENDEDOR-UUID-7f3a',
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
      expect(
        parseJevResponse({ questions: { nivel: { answer } } })?.nivel,
      ).toBe(esperado);
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

  it('el modo seco tambien conserva el crudo, asi que el lote se puede rehacer', async () => {
    const fetchImpl = jest.fn();

    const res = await runBatch([actividad('a1'), actividad('a2')], {
      fetchImpl: fetchImpl,
      dryRun: true,
      respuestasEjemplo: [cuerpoOk(2), cuerpoOk(3)],
    });

    expect(res[0].crudo).toEqual(cuerpoOk(2));
    expect(res[1].crudo).toEqual(cuerpoOk(3));
    // Releer lo guardado da exactamente lo mismo: retomar no degrada el lote.
    expect(reparse(res)).toEqual(res);
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

describe('R5 (77-jev-quality-backtest #77): lo que sale de verdad por el cable', () => {
  const capturar = async (fila: SourceActivity = actividad('a1')) => {
    const { sleep } = conEsperas();
    const fetchImpl = jest.fn().mockResolvedValue(respuesta(200, cuerpoOk(4)));

    await askJev(fila, opciones(fetchImpl, sleep));

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    return { url, init };
  };

  it('manda exactamente dos cabeceras: Content-Type y Authorization', async () => {
    const { init } = await capturar();

    expect(Object.keys(init.headers as Record<string, string>).sort()).toEqual([
      'Authorization',
      'Content-Type',
    ]);
  });

  it('el init no lleva nada mas que method, headers y body', async () => {
    const { init } = await capturar();

    expect(Object.keys(init).sort()).toEqual([
      'body',
      'headers',
      'method',
      'signal',
    ]);
  });

  it('la URL es el endpoint pelado, sin query string', async () => {
    const { url } = await capturar();

    expect(url).toBe(JEV_ENDPOINT);
    expect(url).not.toContain('?');
  });

  it('el cuerpo que viaja tiene solo state, model y questions', async () => {
    const { init } = await capturar();
    const cuerpo = JSON.parse(init.body as string) as Record<string, unknown>;

    expect(Object.keys(cuerpo).sort()).toEqual(['model', 'questions', 'state']);
    expect(Object.keys(cuerpo.state as Record<string, unknown>).sort()).toEqual(
      ['agreement', 'discovery', 'next_step', 'summary'],
    );
  });

  it('ni el id ni ningun otro identificador viajan en la peticion completa', async () => {
    const fila = {
      ...actividad('a1'),
      id: 'ID-UNICO-7f3a',
      seller_id: 'VENDEDOR-123',
      client_id: 'CLIENTE-456',
      quality: 100,
      executed_at: '2026-03-04T10:00:00Z',
    };

    const { url, init } = await capturar(fila);
    const peticion = `${url} ${JSON.stringify(init)}`;

    for (const fuera of [
      'ID-UNICO-7f3a',
      'VENDEDOR-UUID-7f3a',
      'VENDEDOR-123',
      'CLIENTE-456',
      'seller_id',
      'quality',
      '2026-03-04',
    ]) {
      expect(peticion).not.toContain(fuera);
    }
  });
});

describe('R9 (77-jev-quality-backtest #77): un cuerpo ilegible no se lleva el lote', () => {
  const respuestaRota = (status = 200) => ({
    status,
    ok: status >= 200 && status < 300,
    json: () =>
      Promise.reject(
        new SyntaxError('Unexpected token < in JSON at position 0'),
      ),
  });

  it('un 200 que no trae JSON deja la actividad en sin_respuesta', async () => {
    const { sleep } = conEsperas();
    const fetchImpl = jest.fn().mockResolvedValue(respuestaRota());

    const res = await askJev(actividad('a1'), opciones(fetchImpl, sleep));

    expect(res.estado).toBe('sin_respuesta');
    expect(res.nivel).toBeNull();
    expect(res.motivo).toMatch(/cuerpo|JSON/i);
  });

  it('el lote continua y conserva lo ya pagado cuando una respuesta es ilegible', async () => {
    const { sleep } = conEsperas();
    const fetchImpl = jest
      .fn()
      .mockImplementation((_url, init: RequestInit) => {
        const cuerpo = JSON.parse(init.body as string) as {
          state: { summary: string };
        };
        return Promise.resolve(
          cuerpo.state.summary.includes('a3')
            ? respuestaRota()
            : respuesta(200, cuerpoOk(4)),
        );
      });

    const res = await runBatch(
      [
        actividad('a1'),
        actividad('a2'),
        actividad('a3'),
        actividad('a4'),
        actividad('a5'),
      ],
      opciones(fetchImpl, sleep),
    );

    expect(res.map((r) => r.id)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5']);
    expect(res.map((r) => r.estado)).toEqual([
      'ok',
      'ok',
      'sin_respuesta',
      'ok',
      'ok',
    ]);
  });
});

describe('R9 (77-jev-quality-backtest #77): cada respuesta se entrega segun llega', () => {
  it('avisa de cada actividad antes de pedir la siguiente', async () => {
    const { sleep } = conEsperas();
    const entregadas: string[] = [];
    const entregadasAlLlamar: number[] = [];
    const fetchImpl = jest.fn().mockImplementation(() => {
      entregadasAlLlamar.push(entregadas.length);
      return Promise.resolve(respuesta(200, cuerpoOk(4)));
    });

    const res = await runBatch(
      [actividad('a1'), actividad('a2'), actividad('a3')],
      {
        ...opciones(fetchImpl, sleep),
        onRespuesta: (r) => entregadas.push(r.id),
      },
    );

    // Antes de la n-esima llamada ya hay n-1 respuestas entregadas: si el
    // proceso muere a mitad, lo pagado hasta ahi esta fuera de memoria.
    expect(entregadasAlLlamar).toEqual([0, 1, 2]);
    expect(entregadas).toEqual(['a1', 'a2', 'a3']);
    expect(res.map((r) => r.id)).toEqual(entregadas);
  });

  it('entrega tambien las que quedan sin respuesta', async () => {
    const { sleep } = conEsperas();
    const entregadas: JevResult[] = [];
    const fetchImpl = jest.fn().mockResolvedValue(respuesta(500));

    await runBatch([actividad('a1')], {
      ...opciones(fetchImpl, sleep),
      onRespuesta: (r) => entregadas.push(r),
    });

    expect(entregadas).toHaveLength(1);
    expect(entregadas[0].estado).toBe('sin_respuesta');
  });

  it('en seco tambien entrega una a una', async () => {
    const entregadas: string[] = [];

    await runBatch([actividad('a1'), actividad('a2')], {
      fetchImpl: jest.fn(),
      dryRun: true,
      respuestasEjemplo: [cuerpoOk(1), cuerpoOk(4)],
      onRespuesta: (r) => entregadas.push(r.id),
    });

    expect(entregadas).toEqual(['a1', 'a2']);
  });
});

describe('R9 (77-jev-quality-backtest #77): una peticion colgada no cuelga el lote', () => {
  // Simula lo que hace fetch de verdad con una señal: si se aborta, rechaza.
  const fetchQueCuelga = () =>
    jest.fn().mockImplementation((_url, init: RequestInit) => {
      return new Promise((_resolver, rechazar) => {
        init.signal?.addEventListener('abort', () =>
          rechazar(new Error('The operation was aborted due to timeout')),
        );
      });
    });

  it('manda una señal de aborto en cada peticion', async () => {
    const { sleep } = conEsperas();
    const fetchImpl = jest.fn().mockResolvedValue(respuesta(200, cuerpoOk(4)));

    await askJev(actividad('a1'), opciones(fetchImpl, sleep));

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.signal?.aborted).toBe(false);
  });

  it('una peticion que no contesta acaba en sin_respuesta, no en espera eterna', async () => {
    const { sleep } = conEsperas();
    const fetchImpl = fetchQueCuelga();

    const res = await askJev(actividad('a1'), {
      ...opciones(fetchImpl, sleep),
      timeoutMs: 5,
    });

    expect(res.estado).toBe('sin_respuesta');
    expect(res.motivo).toMatch(/red|abort/i);
  });

  it('el lote sigue despues de una peticion colgada', async () => {
    const { sleep } = conEsperas();
    const entregadas: string[] = [];
    const fetchImpl = jest
      .fn()
      .mockImplementationOnce((_url: string, init: RequestInit) => {
        return new Promise((_r, rechazar) => {
          init.signal?.addEventListener('abort', () =>
            rechazar(new Error('The operation was aborted due to timeout')),
          );
        });
      })
      .mockResolvedValue(respuesta(200, cuerpoOk(3)));

    const res = await runBatch([actividad('a1'), actividad('a2')], {
      ...opciones(fetchImpl, sleep),
      timeoutMs: 5,
      onRespuesta: (r) => entregadas.push(r.id),
    });

    expect(res.map((r) => r.estado)).toEqual(['sin_respuesta', 'ok']);
    expect(entregadas).toEqual(['a1', 'a2']);
  });
});

describe('R9 (77-jev-quality-backtest #77): que actividades hay que volver a consultar', () => {
  const guardada = (estado: 'ok' | 'sin_respuesta', extra = {}): JevResult => ({
    id: 'a1',
    estado,
    nivel: estado === 'ok' ? 4 : null,
    distribucion: null,
    confianza: null,
    ...extra,
  });

  it('sin nada guardado hay que llamar', () => {
    expect(necesitaLlamada(undefined)).toBe(true);
  });

  it('una respuesta buena no se vuelve a pedir nunca', () => {
    expect(necesitaLlamada(guardada('ok'))).toBe(false);
    expect(necesitaLlamada(guardada('ok', { crudo: { a: 1 } }))).toBe(false);
  });

  it('se reintenta lo que no llego a ser una respuesta', () => {
    for (const motivo of [
      'agotados 3 reintentos con codigo reintentable',
      'fallo de red: The operation was aborted due to timeout',
      'fallo de red: socket hang up',
      'HTTP 429',
      'HTTP 500',
      'HTTP 503',
      'cuerpo ilegible: Unexpected token < in JSON at position 0',
    ]) {
      expect(necesitaLlamada(guardada('sin_respuesta', { motivo }))).toBe(true);
    }
  });

  it('un 4xx que no es 429 es definitivo: repetirlo exporta otra vez para el mismo rechazo', () => {
    for (const motivo of ['HTTP 400', 'HTTP 401', 'HTTP 403', 'HTTP 404']) {
      expect(necesitaLlamada(guardada('sin_respuesta', { motivo }))).toBe(
        false,
      );
    }
  });

  it('si el servidor contesto y guardamos su cuerpo, el arreglo es releerlo, no llamar otra vez', () => {
    expect(
      necesitaLlamada(
        guardada('sin_respuesta', {
          motivo: 'respuesta sin la forma esperada',
          crudo: { otra: 'cosa' },
        }),
      ),
    ).toBe(false);
  });
});
