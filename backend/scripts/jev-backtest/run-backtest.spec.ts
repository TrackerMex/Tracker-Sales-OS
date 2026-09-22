import { JevResult } from './jev-client';
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
      guardarRespuestas: () => undefined,
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
  const leerDe = (ruta: string) => escrituras[ruta] ?? iniciales[ruta];
  return {
    escrituras,
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
    expect(Object.keys(escrituras)).toContain(RUTA_INFORME);
  });
});
