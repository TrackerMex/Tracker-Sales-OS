import { JevResult, MOTIVO_NUNCA_LLAMADA, nuncaLlamada } from './jev-client';
import { Metrics } from './metrics';
import {
  LoteGuardado,
  RUTA_ETIQUETADO,
  RUTA_INFORME,
  RUTA_LOTE,
  RUTA_RESPUESTAS,
  evaluarLote,
  faseEvaluar,
  main,
  necesitaAprobacion,
  parseArgs,
  renderReport,
  rutaInforme,
  rutaRespuestas,
} from './run-backtest';
import { BatchActivity, EvaluatedActivity, Level } from './types';

const UMBRALES = { minFalsos100Detectados: 0.7, maxBuenosDegradados: 0.15 };

const lote: BatchActivity[] = [
  {
    id: 'a1',
    quality: 100,
    franja: 'alta',
    seller_id: 'VENDEDOR-UUID-7f3a',
    summary: 'visita uno',
    discovery: 'necesidad uno',
    agreement: 'acuerdo uno',
    next_step: 'paso uno',
  },
  {
    id: 'a2',
    quality: 100,
    franja: 'alta',
    seller_id: 'VENDEDOR-UUID-9c2b',
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

describe('R8 (77-jev-quality-backtest #77): nada se calcula antes de tener las respuestas', () => {
  it('consulta primero y renderiza despues', async () => {
    const orden: string[] = [];

    await evaluarLote(lote, etiquetas, UMBRALES, {
      consultar: () => {
        orden.push('consultar');
        return Promise.resolve(respuestas);
      },
      guardarInforme: () => {
        orden.push('informe');
      },
    });

    expect(orden).toEqual(['consultar', 'informe']);
  });

  it('calcula las metricas sobre la union de etiquetas y respuestas', async () => {
    const metricas = await evaluarLote(lote, etiquetas, UMBRALES, {
      consultar: () => Promise.resolve(respuestas),
      guardarInforme: () => undefined,
    });

    expect(metricas.total).toBe(2);
    expect(metricas.sinRespuesta).toBe(0);
    expect(metricas.falsos100.falsos100).toBe(1);
    expect(metricas.falsos100.detectadosPorJev).toBe(1);
  });
});

describe('R4 (77-jev-quality-backtest #77): que fases exigen la aprobacion escrita', () => {
  const exige = (argv: string[]) => necesitaAprobacion(parseArgs(argv));

  it('la exige extraer, que saca texto comercial de produccion a disco', () => {
    expect(exige(['--fase', 'extraer'])).toBe(true);
  });

  it('la exige extraer aunque le pongan --dry-run: el modo seco no exime de leer produccion', () => {
    expect(exige(['--fase', 'extraer', '--dry-run'])).toBe(true);
  });

  it('la exige evaluar, que es la que llama a la API', () => {
    expect(exige(['--fase', 'evaluar'])).toBe(true);
    expect(exige(['--fase', 'evaluar', '--reusar-respuestas'])).toBe(true);
  });

  it('la exige la fase por defecto y cualquier fase desconocida', () => {
    expect(exige([])).toBe(true);
    expect(exige(['--fase', 'informe'])).toBe(true);
  });

  it('solo evaluar --dry-run esta exento: ni lee produccion ni llama a la API', () => {
    expect(exige(['--fase', 'evaluar', '--dry-run'])).toBe(false);
  });
});

describe('R4 (77-jev-quality-backtest #77): el script aborta antes de tocar nada', () => {
  let errores: string[];

  beforeEach(() => {
    errores = [];
    jest.spyOn(console, 'error').mockImplementation((...args) => {
      errores.push(args.map(String).join(' '));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const casos: [string, string[]][] = [
    ['--fase extraer', ['--fase', 'extraer']],
    ['--fase extraer --dry-run', ['--fase', 'extraer', '--dry-run']],
    ['--fase evaluar', ['--fase', 'evaluar']],
    ['sin --fase', []],
    ['una fase desconocida', ['--fase', 'informe']],
  ];

  it.each(casos)(
    '%s sin JEV_BACKTEST_APPROVED sale con codigo 1 y sin peticiones',
    async (_nombre, argv) => {
      const fetchSpy = jest.fn();

      const codigo = await main(
        argv,
        {},
        {
          fetchImpl: fetchSpy as unknown as typeof fetch,
        },
      );

      expect(codigo).toBe(1);
      expect(errores.join('\n')).toContain('JEV_BACKTEST_APPROVED');
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it('aborta por R4 antes de abrir la base, aunque tenga la cadena de conexion', async () => {
    const codigo = await main(
      ['--fase', 'extraer'],
      { JEV_BACKTEST_DATABASE_URL: 'postgres://solo_lectura@localhost/db' },
      {},
    );

    expect(codigo).toBe(1);
    expect(errores.join('\n')).toContain('JEV_BACKTEST_APPROVED');
    expect(errores.join('\n')).not.toContain('JEV_BACKTEST_DATABASE_URL');
  });
});

describe('R11 (77-jev-quality-backtest #77): el informe va versionado, no puede llevar identificadores', () => {
  const informe = async (): Promise<string> => {
    const capturas: [Metrics, EvaluatedActivity[], JevResult[]][] = [];

    await evaluarLote(lote, etiquetas, UMBRALES, {
      consultar: () => Promise.resolve(respuestas),
      guardarInforme: (m, filas, resp) => {
        capturas.push([m, filas, resp]);
      },
    });

    const guardado: LoteGuardado = {
      semilla: 77,
      generado: '2026-09-22T00:00:00.000Z',
      candidatas: 120,
      excluidas: 3,
      desviaciones: [],
      orden: lote,
    };
    const [m, filas, resp] = capturas[0];
    return renderReport(m, filas, resp, guardado, parseArgs([]));
  };

  it('publica la concentracion por vendedor, que es lo que dice si el veredicto generaliza', async () => {
    const md = await informe();

    expect(md).toContain('Reparto por vendedor');
    expect(md).toContain('Vendedores distintos: 2');
  });

  it('no publica ningun seller_id: el indice del reparto es arbitrario', async () => {
    const md = await informe();

    expect(md).not.toContain('VENDEDOR-UUID-7f3a');
    expect(md).not.toContain('VENDEDOR-UUID-9c2b');
    expect(md).not.toContain('seller_id');
  });
});

// Ficheros en memoria: las pruebas de cableado no tocan el disco, y asi se
// puede afirmar QUE se escribe y DONDE, que es lo que se perdio en ALTA-6.
const fsFalso = (iniciales: Record<string, string> = {}) => {
  const escrituras: Record<string, string> = {};
  const anadidos: string[] = [];
  const leerDe = (ruta: string) => escrituras[ruta] ?? iniciales[ruta];
  return {
    escrituras,
    anadidos,
    fs: {
      existe: (ruta: string) => leerDe(ruta) !== undefined,
      leer: (ruta: string) => {
        const contenido = leerDe(ruta);
        if (contenido === undefined) {
          throw new Error(`ENOENT: ${ruta}`);
        }
        return contenido;
      },
      escribir: (ruta: string, contenido: string) => {
        escrituras[ruta] = contenido;
      },
      anadir: (ruta: string, contenido: string) => {
        anadidos.push(contenido);
        escrituras[ruta] = (leerDe(ruta) ?? '') + contenido;
      },
    },
  };
};

const loteGuardadoJson = JSON.stringify({
  semilla: 77,
  generado: '2026-09-22T00:00:00.000Z',
  candidatas: 10,
  excluidas: 0,
  desviaciones: [],
  orden: lote,
} satisfies LoteGuardado);

const etiquetadoDe = (niveles: number[]) =>
  [
    '# Etiquetado',
    '',
    ...niveles.flatMap((nivel, i) => [
      '---',
      '',
      `## ${i + 1}`,
      '',
      '- Resumen: texto',
      '',
      `Nivel: ${[1, 2, 3, 4]
        .map((k) => `[${k === nivel ? 'x' : ' '}] ${k}`)
        .join('  ')}`,
      '',
    ]),
  ].join('\n');

const crudoDe = (nivel: number) => ({
  questions: { nivel: { answer: nivel } },
});

describe('R10 (77-jev-quality-backtest #77): un ensayo en seco no destruye la corrida real', () => {
  it('el fichero de respuestas no es el mismo en seco que en real', () => {
    expect(rutaRespuestas(false)).toBe(RUTA_RESPUESTAS);
    expect(rutaRespuestas(true)).not.toBe(RUTA_RESPUESTAS);
  });

  it('un --dry-run escribe en su propio fichero y no en el real', async () => {
    const { fs, escrituras } = fsFalso({
      [RUTA_LOTE]: loteGuardadoJson,
      [RUTA_ETIQUETADO]: etiquetadoDe([1, 4]),
    });

    const codigo = await faseEvaluar(
      parseArgs(['--fase', 'evaluar', '--dry-run']),
      {},
      { fs },
    );

    expect(codigo).toBe(0);
    expect(Object.keys(escrituras)).toContain(rutaRespuestas(true));
    expect(Object.keys(escrituras)).not.toContain(RUTA_RESPUESTAS);
  });

  it('las respuestas reales ya pagadas siguen intactas despues del ensayo', async () => {
    const reales = JSON.stringify({
      generado: '2026-09-22T00:00:00.000Z',
      modo: 'real',
      respuestas: [
        { id: 'a1', crudo: crudoDe(1) },
        { id: 'a2', crudo: crudoDe(4) },
      ],
    });
    const { fs, escrituras } = fsFalso({
      [RUTA_LOTE]: loteGuardadoJson,
      [RUTA_ETIQUETADO]: etiquetadoDe([1, 4]),
      [RUTA_RESPUESTAS]: reales,
    });

    await faseEvaluar(
      parseArgs(['--fase', 'evaluar', '--dry-run']),
      {},
      { fs },
    );

    expect(escrituras[RUTA_RESPUESTAS]).toBeUndefined();
    expect(fs.leer(RUTA_RESPUESTAS)).toBe(reales);
  });

  it('retomar una corrida real no lee el fichero del ensayo', async () => {
    const { fs } = fsFalso({
      [RUTA_LOTE]: loteGuardadoJson,
      [RUTA_ETIQUETADO]: etiquetadoDe([1, 4]),
      [rutaRespuestas(true)]: JSON.stringify({ respuestas: [] }),
    });

    await expect(
      faseEvaluar(
        parseArgs(['--fase', 'evaluar', '--reusar-respuestas']),
        {},
        { fs },
      ),
    ).rejects.toThrow(/no hay respuestas guardadas/);
  });
});

describe('R6 (77-jev-quality-backtest #77): la validacion del etiquetado esta enchufada', () => {
  const evaluarCon = (etiquetado: string) => {
    const { fs, escrituras } = fsFalso({
      [RUTA_LOTE]: loteGuardadoJson,
      [RUTA_ETIQUETADO]: etiquetado,
    });
    return {
      escrituras,
      correr: () =>
        faseEvaluar(parseArgs(['--fase', 'evaluar', '--dry-run']), {}, { fs }),
    };
  };

  it('con un bloque de menos para antes de medir y no escribe nada', async () => {
    const { correr, escrituras } = evaluarCon(etiquetadoDe([1]));

    await expect(correr()).rejects.toThrow(/no cuadra con el lote/);
    expect(Object.keys(escrituras)).toEqual([]);
  });

  it('con una posicion repetida tampoco sigue', async () => {
    const repetido = etiquetadoDe([1, 4]).replace('## 2', '## 1');
    const { correr, escrituras } = evaluarCon(repetido);

    await expect(correr()).rejects.toThrow(/no cuadra con el lote/);
    expect(Object.keys(escrituras)).toEqual([]);
  });

  it('con el etiquetado completo sigue adelante y deja el informe', async () => {
    const { correr, escrituras } = evaluarCon(etiquetadoDe([1, 4]));

    await expect(correr()).resolves.toBe(0);
    expect(Object.keys(escrituras)).toContain(rutaInforme(true));
  });
});

describe('R11 (77-jev-quality-backtest #77): cada n/d del informe dice por que', () => {
  const informeCon = async (
    etiquetasDeDirector: Map<string, Level | null>,
  ): Promise<string> => {
    const capturas: [Metrics, EvaluatedActivity[], JevResult[]][] = [];

    await evaluarLote(lote, etiquetasDeDirector, UMBRALES, {
      consultar: () => Promise.resolve(respuestas),
      guardarInforme: (m, filas, resp) => {
        capturas.push([m, filas, resp]);
      },
    });

    const guardado: LoteGuardado = {
      semilla: 77,
      generado: '2026-09-22T00:00:00.000Z',
      candidatas: 120,
      excluidas: 3,
      desviaciones: [],
      orden: lote,
    };
    const [m, filas, resp] = capturas[0];
    return renderReport(m, filas, resp, guardado, parseArgs([]));
  };

  it('explica el n/d de Spearman cuando una de las series es constante', async () => {
    // El director pone el mismo nivel a las dos: su serie no varia, asi que no
    // hay correlacion que medir aunque haya pares comparables.
    const md = await informeCon(
      new Map([
        ['a1', 1],
        ['a2', 1],
      ]),
    );

    expect(md).toContain('Correlacion de Spearman: n/d');
    expect(md).toContain('Pares comparables: 2');
    expect(md).toMatch(/constante/i);
  });

  it('no mete la explicacion cuando Spearman si tiene valor', async () => {
    const md = await informeCon(etiquetas);

    expect(md).not.toMatch(/constante/i);
  });
});

describe('R11 (77-jev-quality-backtest #77): el ensayo tampoco pisa el informe que firma el director', () => {
  it('el informe no es el mismo fichero en seco que en real', () => {
    expect(rutaInforme(false)).toBe(RUTA_INFORME);
    expect(rutaInforme(true)).not.toBe(RUTA_INFORME);
  });

  it('un --dry-run escribe su informe aparte y no toca el versionado', async () => {
    const previo = '# Informe firmado\n\nlo que escribio el director\n';
    const { fs, escrituras } = fsFalso({
      [RUTA_LOTE]: loteGuardadoJson,
      [RUTA_ETIQUETADO]: etiquetadoDe([1, 4]),
      [RUTA_INFORME]: previo,
    });

    const codigo = await faseEvaluar(
      parseArgs(['--fase', 'evaluar', '--dry-run']),
      {},
      { fs },
    );

    expect(codigo).toBe(0);
    expect(Object.keys(escrituras)).toContain(rutaInforme(true));
    expect(escrituras[RUTA_INFORME]).toBeUndefined();
    expect(fs.leer(RUTA_INFORME)).toBe(previo);
  });
});

describe('R8 (77-jev-quality-backtest #77): el lote es durable segun llega, no al final', () => {
  it('deja una linea por actividad en el fichero de respuestas', async () => {
    const { fs, escrituras } = fsFalso({
      [RUTA_LOTE]: loteGuardadoJson,
      [RUTA_ETIQUETADO]: etiquetadoDe([1, 4]),
    });

    await faseEvaluar(
      parseArgs(['--fase', 'evaluar', '--dry-run']),
      {},
      { fs },
    );

    const lineas = escrituras[rutaRespuestas(true)]
      .split('\n')
      .filter((l) => l.trim());
    expect(lineas).toHaveLength(lote.length);
    expect(lineas.map((l) => (JSON.parse(l) as JevResult).id).sort()).toEqual([
      'a1',
      'a2',
    ]);
  });

  it('retomar lee ese fichero por lineas y se queda con la ultima de cada id', async () => {
    const lineas = [
      JSON.stringify({ id: 'a1', crudo: crudoDe(1) }),
      JSON.stringify({ id: 'a2', crudo: crudoDe(1) }),
      // una segunda pasada corrigio a2: la ultima gana
      JSON.stringify({ id: 'a2', crudo: crudoDe(4) }),
      '',
    ].join('\n');
    const { fs, escrituras } = fsFalso({
      [RUTA_LOTE]: loteGuardadoJson,
      [RUTA_ETIQUETADO]: etiquetadoDe([1, 4]),
      [RUTA_RESPUESTAS]: lineas,
    });

    const codigo = await faseEvaluar(
      parseArgs(['--fase', 'evaluar', '--reusar-respuestas']),
      {},
      { fs },
    );

    expect(codigo).toBe(0);
    const informe = escrituras[RUTA_INFORME];
    expect(informe).toContain('Sin respuesta de Jev (R9): 0');
    // a1 nivel 1 y a2 nivel 4: acuerdo exacto con el director, que puso 1 y 4
    expect(informe).toContain('Acuerdo exacto: 100.0%');
  });

  it('una linea truncada no se lleva por delante el resto del fichero', async () => {
    const lineas = [
      JSON.stringify({ id: 'a1', crudo: crudoDe(1) }),
      '{"id":"a2","crudo":{"questions":',
    ].join('\n');
    const { fs, escrituras } = fsFalso({
      [RUTA_LOTE]: loteGuardadoJson,
      [RUTA_ETIQUETADO]: etiquetadoDe([1, 4]),
      [RUTA_RESPUESTAS]: lineas,
    });

    const codigo = await faseEvaluar(
      parseArgs(['--fase', 'evaluar', '--reusar-respuestas']),
      {},
      { fs },
    );

    expect(codigo).toBe(0);
    expect(escrituras[RUTA_INFORME]).toContain('Sin respuesta de Jev (R9): 1');
  });
});

describe('R10 (77-jev-quality-backtest #77): reanudar sin volver a exportar lo ya exportado', () => {
  const lineaOk = (id: string, nivel: number) =>
    JSON.stringify({
      id,
      estado: 'ok',
      nivel,
      distribucion: null,
      confianza: null,
      crudo: crudoDe(nivel),
    });

  const lineaFallida = (id: string, motivo: string) =>
    JSON.stringify({
      id,
      estado: 'sin_respuesta',
      nivel: null,
      distribucion: null,
      confianza: null,
      motivo,
    });

  const correrCon = (previo: string | undefined, argv: string[]) => {
    const iniciales: Record<string, string> = {
      [RUTA_LOTE]: loteGuardadoJson,
      [RUTA_ETIQUETADO]: etiquetadoDe([1, 4]),
    };
    if (previo !== undefined) iniciales[rutaRespuestas(true)] = previo;
    const { fs, escrituras, anadidos } = fsFalso(iniciales);
    return {
      escrituras,
      anadidos,
      correr: () => faseEvaluar(parseArgs(argv), {}, { fs }),
    };
  };

  it('no vuelve a consultar la actividad que ya tiene respuesta buena', async () => {
    const { correr, anadidos } = correrCon(`${lineaOk('a1', 4)}\n`, [
      '--fase',
      'evaluar',
      '--dry-run',
    ]);

    await expect(correr()).resolves.toBe(0);

    expect(anadidos).toHaveLength(1);
    expect((JSON.parse(anadidos[0]) as JevResult).id).toBe('a2');
  });

  it('con el lote entero ya respondido no consulta nada', async () => {
    const { correr, anadidos } = correrCon(
      `${lineaOk('a1', 4)}\n${lineaOk('a2', 3)}\n`,
      ['--fase', 'evaluar', '--dry-run'],
    );

    await expect(correr()).resolves.toBe(0);

    expect(anadidos).toEqual([]);
  });

  it('si vuelve a consultar es porque la anterior no llego a ser respuesta', async () => {
    const { correr, anadidos } = correrCon(
      `${lineaOk('a1', 4)}\n${lineaFallida('a2', 'HTTP 429')}\n`,
      ['--fase', 'evaluar', '--dry-run'],
    );

    await expect(correr()).resolves.toBe(0);

    expect(anadidos).toHaveLength(1);
    expect((JSON.parse(anadidos[0]) as JevResult).id).toBe('a2');
  });

  it('una respuesta buena no se degrada aunque el fichero traiga un fallo posterior', async () => {
    const { correr, escrituras } = correrCon(
      `${lineaOk('a1', 4)}\n${lineaFallida('a1', 'HTTP 429')}\n${lineaOk('a2', 3)}\n`,
      ['--fase', 'evaluar', '--dry-run', '--reusar-respuestas'],
    );

    await expect(correr()).resolves.toBe(0);

    const informe = escrituras[rutaInforme(true)];
    expect(informe).toContain('Sin respuesta de Jev (R9): 0');
  });
});

const informeDe = async (
  resp: JevResult[],
  etq: Map<string, Level | null> = etiquetas,
): Promise<string> => {
  const capturas: [Metrics, EvaluatedActivity[], JevResult[]][] = [];

  await evaluarLote(lote, etq, UMBRALES, {
    consultar: () => Promise.resolve(resp),
    guardarInforme: (m, filas, r) => {
      capturas.push([m, filas, r]);
    },
  });

  const guardado: LoteGuardado = {
    semilla: 77,
    generado: '2026-09-22T00:00:00.000Z',
    candidatas: 120,
    excluidas: 3,
    desviaciones: [],
    orden: lote,
  };
  const [m, filas, r] = capturas[0];
  return renderReport(m, filas, r, guardado, parseArgs([]));
};

describe('R8 (77-jev-quality-backtest #77): el informe distingue no llamada de llamada fallida', () => {
  it('imprime el motivo de cada actividad sin respuesta', async () => {
    const md = await informeDe([
      {
        id: 'a1',
        estado: 'sin_respuesta',
        nivel: null,
        distribucion: null,
        confianza: null,
        motivo: 'HTTP 429',
      },
      nuncaLlamada('a2'),
    ]);

    expect(md).toContain('HTTP 429');
    expect(md).toContain(MOTIVO_NUNCA_LLAMADA);
  });

  it('una respuesta buena no arrastra motivo', async () => {
    const md = await informeDe(respuestas);

    expect(md).not.toContain(MOTIVO_NUNCA_LLAMADA);
    expect(md).not.toContain('HTTP 429');
  });
});

describe('R11 (77-jev-quality-backtest #77): un informe incompleto se declara incompleto', () => {
  const cabeceraDe = (md: string) => md.slice(0, md.indexOf('## Veredicto'));

  it('lo dice arriba, no solo en el detalle, cuando falta alguna respuesta', async () => {
    const md = await informeDe([respuestas[0], nuncaLlamada('a2')]);

    expect(cabeceraDe(md)).toMatch(/parcial/i);
    expect(cabeceraDe(md)).toContain('1 de 2');
  });

  it('distingue arriba las que nunca se consultaron', async () => {
    const md = await informeDe([respuestas[0], nuncaLlamada('a2')]);

    expect(cabeceraDe(md)).toMatch(/1 (de ellas )?(nunca|sin consultar)/i);
  });

  it('con el lote entero respondido no se declara parcial', async () => {
    const md = await informeDe(respuestas);

    expect(md).not.toMatch(/parcial/i);
  });
});
