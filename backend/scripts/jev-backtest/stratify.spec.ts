import {
  BATCH_QUERY,
  BATCH_TARGETS,
  classify,
  isEmptyActivity,
  stratify,
} from './stratify';
import { SourceActivity } from './types';

const act = (
  id: string,
  quality: number,
  over: Partial<SourceActivity> = {},
): SourceActivity => ({
  id,
  quality,
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
      expect(BATCH_QUERY.toUpperCase()).not.toContain(verbo);
    }
  });

  it('solo lee la tabla activities y sus seis columnas necesarias', () => {
    expect(BATCH_QUERY).toContain('FROM activities');
    for (const col of [
      'id',
      'quality',
      'summary',
      'discovery',
      'agreement',
      'next_step',
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
