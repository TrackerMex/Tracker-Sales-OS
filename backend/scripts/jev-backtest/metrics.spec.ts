import {
  adjacentAgreement,
  computeMetrics,
  confusionMatrix,
  exactAgreement,
  falseHundreds,
  normalizeQuality,
  pairsWith,
  spearman,
  verdict,
} from './metrics';
import { EvaluatedActivity, Level } from './types';

/** Cuatro pares (humano, jev) calculados a mano en el cuerpo de cada test. */
const PARES: [Level, Level][] = [
  [1, 1],
  [2, 3],
  [3, 3],
  [4, 2],
];

const fila = (
  id: string,
  quality: number,
  humano: Level | null,
  jev: Level | null,
): EvaluatedActivity => ({ id, quality, humano, jev });

/**
 * Lote de 12 actividades. Diez con quality = 100, de las cuales el director
 * etiqueta cinco en nivel 1 o 2 (los falsos 100). Dos mas de la franja media
 * que el director etiqueta bien.
 */
const loteBase = (
  jevEn100: Level[],
  jevEnMedia: Level[],
): EvaluatedActivity[] => {
  const humanoEn100: Level[] = [1, 1, 2, 2, 1, 3, 4, 4, 3, 4];
  const humanoEnMedia: Level[] = [3, 4];
  return [
    ...humanoEn100.map((h, i) => fila(`c${i}`, 100, h, jevEn100[i])),
    ...humanoEnMedia.map((h, i) => fila(`m${i}`, 60, h, jevEnMedia[i])),
  ];
};

// Jev detecta 4 de los 5 falsos 100 y no degrada ningun bueno.
const LOTE_POSITIVO = loteBase([1, 2, 1, 2, 3, 3, 4, 4, 3, 4], [3, 4]);
// Jev solo detecta 3 de los 5 falsos 100. Sigue sin degradar buenos.
const LOTE_POCOS_DETECTADOS = loteBase([1, 2, 1, 3, 3, 3, 4, 4, 3, 4], [3, 4]);
// Jev detecta los 5 falsos 100 pero tumba 2 de los 7 buenos al nivel 1 o 2.
const LOTE_MUCHOS_DEGRADADOS = loteBase([1, 2, 1, 2, 2, 1, 4, 4, 2, 4], [3, 4]);

const UMBRALES = { minFalsos100Detectados: 0.7, maxBuenosDegradados: 0.15 };

describe('R11 (77-jev-quality-backtest #77): matriz de confusion y acuerdos', () => {
  it('cuenta cada par en la celda [humano][comparado]', () => {
    expect(confusionMatrix(PARES)).toEqual([
      [1, 0, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
    ]);
  });

  it('el acuerdo exacto es la fraccion de pares identicos', () => {
    expect(exactAgreement(PARES)).toBeCloseTo(0.5, 10);
  });

  it('el acuerdo adyacente admite un nivel de diferencia', () => {
    expect(adjacentAgreement(PARES)).toBeCloseTo(0.75, 10);
  });

  it('la correlacion de Spearman usa rangos promediados en los empates', () => {
    expect(spearman([1, 2, 3, 4], [1, 3, 3, 2])).toBeCloseTo(0.3162, 4);
  });

  it('normaliza el quality actual a los cuatro niveles segun D3', () => {
    expect(normalizeQuality(0)).toBe(1);
    expect(normalizeQuality(20)).toBe(1);
    expect(normalizeQuality(40)).toBe(2);
    expect(normalizeQuality(60)).toBe(3);
    expect(normalizeQuality(80)).toBe(3);
    expect(normalizeQuality(100)).toBe(4);
  });

  it('compara al director contra Jev y contra el quality normalizado', () => {
    const filas = [fila('x', 100, 1, 2), fila('y', 40, 3, 3)];

    expect(pairsWith(filas, 'jev')).toEqual([
      [1, 2],
      [3, 3],
    ]);
    expect(pairsWith(filas, 'quality')).toEqual([
      [1, 4],
      [3, 2],
    ]);
  });

  it('deja fuera de los pares lo que no tiene etiqueta o quedo sin_respuesta', () => {
    const filas = [
      fila('x', 100, 1, null),
      fila('y', 100, null, 2),
      fila('z', 100, 2, 2),
    ];

    expect(pairsWith(filas, 'jev')).toEqual([[2, 2]]);
    expect(pairsWith(filas, 'quality')).toEqual([
      [1, 4],
      [2, 4],
    ]);
  });
});

describe('R12 (77-jev-quality-backtest #77): tasa de falsos 100', () => {
  it('cuenta los quality=100 que el director tumba a nivel 1 o 2', () => {
    const stats = falseHundreds(LOTE_POSITIVO);

    expect(stats.conQuality100).toBe(10);
    expect(stats.falsos100).toBe(5);
    expect(stats.tasaFalsos100).toBeCloseTo(0.5, 10);
  });

  it('cuenta, sobre ese subconjunto, cuantos tumba tambien Jev', () => {
    expect(falseHundreds(LOTE_POSITIVO).detectadosPorJev).toBe(4);
    expect(falseHundreds(LOTE_POSITIVO).fraccionDetectada).toBeCloseTo(0.8, 10);
    expect(falseHundreds(LOTE_POCOS_DETECTADOS).fraccionDetectada).toBeCloseTo(
      0.6,
      10,
    );
  });

  it('un falso 100 sin respuesta de Jev cuenta como no detectado', () => {
    const filas = [
      fila('a', 100, 1, 1),
      fila('b', 100, 2, null),
      fila('c', 100, 4, 4),
    ];
    const stats = falseHundreds(filas);

    expect(stats.falsos100).toBe(2);
    expect(stats.detectadosPorJev).toBe(1);
    expect(stats.falsos100SinRespuesta).toBe(1);
    expect(stats.fraccionDetectada).toBeCloseTo(0.5, 10);
  });

  it('sin ningun quality=100 etiquetado la tasa no existe', () => {
    const stats = falseHundreds([fila('a', 60, 3, 3)]);

    expect(stats.conQuality100).toBe(0);
    expect(stats.tasaFalsos100).toBeNull();
    expect(stats.fraccionDetectada).toBeNull();
  });
});

describe('R13 (77-jev-quality-backtest #77): veredicto del gate', () => {
  it('es positivo cuando se cumplen las dos condiciones', () => {
    const v = verdict(LOTE_POSITIVO, UMBRALES);

    expect(v.fraccionDetectada).toBeCloseTo(0.8, 10);
    expect(v.fraccionDegradados).toBeCloseTo(0, 10);
    expect(v.positivo).toBe(true);
    expect(v.motivos).toEqual([]);
  });

  it('es negativo si Jev detecta menos del 70% de los falsos 100', () => {
    const v = verdict(LOTE_POCOS_DETECTADOS, UMBRALES);

    expect(v.fraccionDetectada).toBeCloseTo(0.6, 10);
    expect(v.fraccionDegradados).toBeCloseTo(0, 10);
    expect(v.positivo).toBe(false);
    expect(v.motivos).toHaveLength(1);
    expect(v.motivos[0]).toContain('falsos 100');
  });

  it('es negativo si Jev degrada mas del 15% de los buenos', () => {
    const v = verdict(LOTE_MUCHOS_DEGRADADOS, UMBRALES);

    expect(v.buenos).toBe(7);
    expect(v.degradados).toBe(2);
    expect(v.fraccionDetectada).toBeCloseTo(1, 10);
    expect(v.fraccionDegradados).toBeCloseTo(2 / 7, 10);
    expect(v.positivo).toBe(false);
    expect(v.motivos).toHaveLength(1);
    expect(v.motivos[0]).toContain('degrada');
  });

  it('sin falsos 100 que detectar el veredicto no puede ser positivo', () => {
    const v = verdict([fila('a', 100, 4, 4), fila('b', 60, 3, 3)], UMBRALES);

    expect(v.positivo).toBe(false);
    expect(v.fraccionDetectada).toBeNull();
    expect(v.motivos[0]).toContain('falsos 100');
  });

  it('respeta los umbrales que le pasan, no los de R13 por defecto', () => {
    const flojo = verdict(LOTE_POCOS_DETECTADOS, {
      minFalsos100Detectados: 0.5,
      maxBuenosDegradados: 0.15,
    });

    expect(flojo.positivo).toBe(true);
    expect(flojo.minFalsos100Detectados).toBe(0.5);
  });
});

describe('R11 (77-jev-quality-backtest #77): agregado para el informe', () => {
  it('reune las dos matrices, las tres cifras de acuerdo y el veredicto', () => {
    const m = computeMetrics(LOTE_POSITIVO, UMBRALES);

    expect(m.matrizJev).toHaveLength(4);
    expect(m.matrizQuality).toHaveLength(4);
    expect(m.acuerdoExacto).toBeCloseTo(
      exactAgreement(pairsWith(LOTE_POSITIVO, 'jev')),
      10,
    );
    expect(m.acuerdoAdyacente).toBeCloseTo(
      adjacentAgreement(pairsWith(LOTE_POSITIVO, 'jev')),
      10,
    );
    expect(typeof m.spearman).toBe('number');
    expect(m.falsos100.falsos100).toBe(5);
    expect(m.veredicto.positivo).toBe(true);
    expect(m.sinRespuesta).toBe(0);
    expect(m.total).toBe(12);
  });
});
