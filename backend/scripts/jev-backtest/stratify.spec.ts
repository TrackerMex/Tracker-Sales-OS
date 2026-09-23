import {
  BATCH_QUERY,
  BATCH_TARGETS,
  compararConcentracion,
  classify,
  isEmptyActivity,
  sellerSpread,
  stratify,
} from './stratify';
import { BatchActivity, SourceActivity } from './types';

const act = (
  id: string,
  quality: number,
  over: Partial<SourceActivity> = {},
): SourceActivity => ({
  id,
  quality,
  seller_id: `vendedor-de-${id}`,
  summary: 'resumen de la visita con el cliente',
  discovery: 'necesita facturacion mensual',
  agreement: 'acepta cotizacion el viernes',
  next_step: 'enviar propuesta',
  ...over,
});

const pool = (prefix: string, quality: number, n: number): SourceActivity[] =>
  Array.from({ length: n }, (_, i) => act(`${prefix}-${i}`, quality));

const countBy = (rows: { franja: string }[], franja: string) =>
  rows.filter((r) => r.franja === franja).length;

describe('R1 (77-jev-quality-backtest #77): consulta de solo lectura', () => {
  it('la sentencia del lote es un SELECT sin ninguna escritura', () => {
    expect(BATCH_QUERY.trim().toUpperCase().startsWith('SELECT')).toBe(true);
    for (const verbo of ['INSERT', 'UPDATE', 'DELETE', 'ALTER', 'CREATE']) {
      // Palabra completa: `deleted_at IS NULL` es un filtro, no una escritura.
      expect(BATCH_QUERY.toUpperCase()).not.toMatch(
        new RegExp(`\\b${verbo}\\b`),
      );
    }
  });

  it('solo lee la tabla activities y las columnas que necesita', () => {
    expect(BATCH_QUERY).toContain('FROM activities');
    for (const col of [
      'id',
      'quality',
      'summary',
      'discovery',
      'agreement',
      'next_step',
      'seller_id',
    ]) {
      expect(BATCH_QUERY).toContain(col);
    }
  });
});

describe('R2 (77-jev-quality-backtest #77): estratifica 25/15/10', () => {
  it('reparte el lote en las tres franjas con los tamanos objetivo', () => {
    const entrada = [
      ...pool('alta', 100, 40),
      ...pool('media', 60, 30),
      ...pool('baja', 20, 30),
    ];

    const { batch, deviations } = stratify(entrada);

    expect(batch).toHaveLength(50);
    expect(countBy(batch, 'alta')).toBe(BATCH_TARGETS.alta);
    expect(countBy(batch, 'media')).toBe(BATCH_TARGETS.media);
    expect(countBy(batch, 'baja')).toBe(BATCH_TARGETS.baja);
    expect(deviations).toEqual([]);
  });

  it('clasifica 100 como alta, 40 a 80 como media y 20 o menos como baja', () => {
    expect(classify(100)).toBe('alta');
    expect(classify(80)).toBe('media');
    expect(classify(60)).toBe('media');
    expect(classify(40)).toBe('media');
    expect(classify(20)).toBe('baja');
    expect(classify(0)).toBe('baja');
  });

  it('completa la franja baja desde la media y deja constancia', () => {
    const entrada = [
      ...pool('alta', 100, 30),
      ...pool('media', 60, 25),
      ...pool('baja', 0, 4),
    ];

    const { batch, deviations } = stratify(entrada);

    expect(batch).toHaveLength(50);
    expect(countBy(batch, 'baja')).toBe(10);
    expect(deviations).toHaveLength(1);
    expect(deviations[0]).toContain('baja');
    expect(deviations[0]).toContain('media');
    expect(deviations[0]).toContain('6');
  });

  it('completa la franja media desde la alta y deja constancia', () => {
    const entrada = [
      ...pool('alta', 100, 35),
      ...pool('media', 40, 5),
      ...pool('baja', 20, 20),
    ];

    const { batch, deviations } = stratify(entrada);

    expect(batch).toHaveLength(50);
    expect(countBy(batch, 'media')).toBe(15);
    expect(deviations).toHaveLength(1);
    expect(deviations[0]).toContain('media');
    expect(deviations[0]).toContain('alta');
  });

  it('cuando falta la franja alta no hay superior y el lote queda corto', () => {
    const entrada = [
      ...pool('alta', 100, 20),
      ...pool('media', 60, 15),
      ...pool('baja', 0, 10),
    ];

    const { batch, deviations } = stratify(entrada);

    expect(batch).toHaveLength(45);
    expect(countBy(batch, 'alta')).toBe(20);
    expect(deviations).toHaveLength(1);
    expect(deviations[0]).toContain('alta');
    expect(deviations[0]).toContain('sin franja superior');
  });
});

describe('R3 (77-jev-quality-backtest #77): excluye actividades sin texto', () => {
  const vacia = {
    summary: '',
    discovery: null,
    agreement: '   ',
    next_step: null,
  };

  it('detecta la actividad cuyos cuatro campos estan vacios o nulos', () => {
    expect(isEmptyActivity(vacia)).toBe(true);
    expect(
      isEmptyActivity({ ...vacia, discovery: 'pidio precio de lista' }),
    ).toBe(false);
  });

  it('no mete en el lote actividades sin ninguno de los cuatro campos', () => {
    const entrada = [
      act('vacia-1', 100, vacia),
      act('vacia-2', 100, vacia),
      ...pool('alta', 100, 30),
      ...pool('media', 60, 20),
      ...pool('baja', 20, 20),
    ];

    const { batch, excluded } = stratify(entrada);

    expect(excluded).toBe(2);
    expect(batch.map((a) => a.id)).not.toContain('vacia-1');
    expect(batch.map((a) => a.id)).not.toContain('vacia-2');
    expect(batch).toHaveLength(50);
  });
});

describe('R11 (77-jev-quality-backtest #77): concentracion por vendedor en el lote', () => {
  const de = (seller: string): SourceActivity => ({
    ...act(`${seller}-x`, 100),
    seller_id: seller,
  });

  it('cuenta vendedores distintos y que fraccion se lleva el mayor', () => {
    const spread = sellerSpread([de('A'), de('A'), de('A'), de('B'), de('C')]);

    expect(spread.vendedores).toBe(3);
    expect(spread.reparto).toEqual([3, 1, 1]);
    expect(spread.mayor).toBe(3);
    expect(spread.fraccionMayor).toBeCloseTo(0.6, 10);
  });

  it('un lote de un solo vendedor se ve de un vistazo', () => {
    const spread = sellerSpread([de('A'), de('A'), de('A')]);

    expect(spread.vendedores).toBe(1);
    expect(spread.fraccionMayor).toBe(1);
  });

  it('no devuelve ningun identificador de vendedor, solo recuentos', () => {
    const spread = sellerSpread([
      de('9f1c3b7e-0000-4000-8000-VENDEDORUNO'),
      de('9f1c3b7e-0000-4000-8000-VENDEDORDOS'),
    ]);

    expect(JSON.stringify(spread)).not.toContain('VENDEDOR');
    expect(JSON.stringify(spread)).not.toContain('9f1c3b7e');
  });

  it('un lote vacio no tiene fraccion que publicar', () => {
    expect(sellerSpread([])).toEqual({
      vendedores: 0,
      reparto: [],
      mayor: 0,
      fraccionMayor: null,
    });
  });
});

describe('R2 (77-jev-quality-backtest #77): dentro de la franja se elige al azar, no por fecha', () => {
  const deVendedor = (
    id: string,
    quality: number,
    seller: string,
  ): SourceActivity => ({ ...act(id, quality), seller_id: seller });

  // La consulta llega en ORDER BY executed_at DESC, asi que "las primeras" son
  // las mas recientes: si el vendedor mas activo ultimamente copa la cabecera
  // de la franja, recortar sin barajar le entrega el lote entero.
  const poblacionSesgada = [
    ...Array.from({ length: 25 }, (_, i) =>
      deVendedor(`reciente-${i}`, 100, 'V-MONOPOLIO'),
    ),
    ...Array.from({ length: 35 }, (_, i) =>
      deVendedor(`antigua-${i}`, 100, `V-${i % 5}`),
    ),
    ...Array.from({ length: 30 }, (_, i) =>
      deVendedor(`media-${i}`, 60, `V-${i % 5}`),
    ),
    ...Array.from({ length: 30 }, (_, i) =>
      deVendedor(`baja-${i}`, 20, `V-${i % 5}`),
    ),
  ];

  const fraccionAlta = (batch: BatchActivity[], seller: string) =>
    batch.filter((a) => a.franja === 'alta' && a.seller_id === seller).length /
    BATCH_TARGETS.alta;

  it('el lote no hereda el sesgo de quien copa la cabecera de la franja', () => {
    const { batch } = stratify(poblacionSesgada, 77);

    // En la poblacion V-MONOPOLIO es 25 de 60 de la franja alta: 41.7%.
    const enPoblacion = 25 / 60;
    const enLote = fraccionAlta(batch, 'V-MONOPOLIO');

    expect(enLote).toBeLessThan(0.7);
    expect(Math.abs(enLote - enPoblacion)).toBeLessThan(0.25);
  });

  it('la franja alta trae varios vendedores, no uno', () => {
    const { batch } = stratify(poblacionSesgada, 77);
    const vendedores = new Set(
      batch.filter((a) => a.franja === 'alta').map((a) => a.seller_id),
    );

    expect(vendedores.size).toBeGreaterThan(2);
  });

  it('el relleno desde la franja superior tambien toma al azar', () => {
    const entrada = [
      ...Array.from({ length: 30 }, (_, i) =>
        deVendedor(`alta-${i}`, 100, `V-${i % 5}`),
      ),
      // La media tiene 21: las 15 primeras de otros y las 6 ultimas de uno
      // solo, asi que recortar sin barajar deja un sobrante monopolizado.
      ...Array.from({ length: 15 }, (_, i) =>
        deVendedor(`media-${i}`, 60, `V-${i % 5}`),
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        deVendedor(`media-cola-${i}`, 60, 'V-COLA'),
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        deVendedor(`baja-${i}`, 20, `V-${i % 5}`),
      ),
    ];

    const { batch, deviations } = stratify(entrada, 77);
    const rellenadas = batch.filter(
      (a) => a.franja === 'baja' && a.quality === 60,
    );

    expect(deviations).toHaveLength(1);
    expect(rellenadas).toHaveLength(6);
    expect(new Set(rellenadas.map((a) => a.seller_id)).size).toBeGreaterThan(1);
  });

  it('misma semilla, mismo lote; otra semilla, otro lote', () => {
    const ids = (semilla: number) =>
      stratify(poblacionSesgada, semilla)
        .batch.map((a) => a.id)
        .join(',');

    expect(ids(77)).toBe(ids(77));
    expect(ids(77)).not.toBe(ids(1234));
  });

  it('sigue respetando el reparto 25/15/10 y las exclusiones de R3', () => {
    const { batch } = stratify(poblacionSesgada, 77);

    expect(batch).toHaveLength(50);
    expect(batch.filter((a) => a.franja === 'alta')).toHaveLength(25);
    expect(batch.filter((a) => a.franja === 'media')).toHaveLength(15);
    expect(batch.filter((a) => a.franja === 'baja')).toHaveLength(10);
  });
});

describe('R11 (77-jev-quality-backtest #77): la comparacion sigue a una sola persona (MEDIA-15)', () => {
  const de = (seller: string, n: number) =>
    Array.from({ length: n }, () => ({ seller_id: seller }));

  it('toma como referencia a quien mas aporta a las candidatas, y mide a esa persona en el lote', () => {
    // En las candidatas manda B (30 de 40). En el lote manda A (3 de 4).
    const candidatas = [...de('A', 10), ...de('B', 30)];
    const lote = [...de('A', 3), ...de('B', 1)];

    const c = compararConcentracion(candidatas, lote);

    expect(c.enCandidatas).toBeCloseTo(0.75, 10);
    expect(c.enLote).toBeCloseTo(0.25, 10);
    expect(c.diferenciaPuntos).toBeCloseTo(-50, 10);
  });

  it('un muestreo fiel no inventa concentracion', () => {
    const candidatas = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5'].flatMap((v) =>
      de(v, 100),
    );
    const lote = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5'].flatMap((v) => de(v, 4));

    expect(
      compararConcentracion(candidatas, lote).diferenciaPuntos,
    ).toBeCloseTo(0, 10);
  });

  it('reproduce el escenario que motivo todo esto', () => {
    // 300 de 640 de una persona en las candidatas; 20 de 25 en la franja alta.
    // El resto repartido entre cinco, para que el prolifico sea el mayor.
    const candidatas = [
      ...de('V-PROLIFICO', 300),
      ...['O0', 'O1', 'O2', 'O3', 'O4'].flatMap((v) => de(v, 68)),
    ];
    const lote = [
      ...de('V-PROLIFICO', 20),
      ...['O0', 'O1', 'O2', 'O3', 'O4'].flatMap((v) => de(v, 1)),
    ];

    const c = compararConcentracion(candidatas, lote);

    expect(c.enCandidatas).toBeCloseTo(300 / 640, 10);
    expect(c.enLote).toBeCloseTo(0.8, 10);
    expect(c.diferenciaPuntos).toBeCloseTo(33.1, 1);
  });

  it('no emite ningun identificador de vendedor', () => {
    const c = compararConcentracion(
      de('VENDEDOR-UUID-7f3a', 5),
      de('VENDEDOR-UUID-7f3a', 2),
    );

    expect(JSON.stringify(c)).not.toContain('VENDEDOR');
    expect(JSON.stringify(c)).not.toContain('7f3a');
  });

  it('sin candidatas o sin lote no hay comparacion', () => {
    expect(compararConcentracion([], de('A', 3))).toEqual({
      enCandidatas: null,
      enLote: null,
      diferenciaPuntos: null,
    });
    expect(compararConcentracion(de('A', 3), [])).toEqual({
      enCandidatas: null,
      enLote: null,
      diferenciaPuntos: null,
    });
  });
});
