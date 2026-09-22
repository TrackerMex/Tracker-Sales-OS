import {
  buildLabelingFile,
  parseLabelingFile,
  shuffleWithSeed,
  validarEtiquetado,
} from './labeling';
import { BatchActivity, Franja, LEVELS } from './types';

const batchActivity = (
  id: string,
  franja: Franja,
  quality: number,
): BatchActivity => ({
  id,
  quality,
  franja,
  seller_id: 'VENDEDOR-UUID-7f3a',
  summary: `resumen ${id} de la visita`,
  discovery: `descubrimiento ${id}`,
  agreement: `acuerdo ${id}`,
  next_step: `siguiente paso ${id}`,
});

const lote: BatchActivity[] = [
  ...Array.from({ length: 6 }, (_, i) => batchActivity(`A${i}`, 'alta', 100)),
  ...Array.from({ length: 4 }, (_, i) => batchActivity(`M${i}`, 'media', 60)),
  ...Array.from({ length: 3 }, (_, i) => batchActivity(`B${i}`, 'baja', 20)),
];

describe('R6 (77-jev-quality-backtest #77): orden aleatorio con semilla fija', () => {
  it('con la misma semilla devuelve siempre el mismo orden', () => {
    const uno = shuffleWithSeed(lote, 77).map((a) => a.id);
    const dos = shuffleWithSeed(lote, 77).map((a) => a.id);

    expect(uno).toEqual(dos);
  });

  it('con otra semilla devuelve otro orden', () => {
    const uno = shuffleWithSeed(lote, 77).map((a) => a.id);
    const dos = shuffleWithSeed(lote, 1234).map((a) => a.id);

    expect(uno).not.toEqual(dos);
  });

  it('es una permutacion: no pierde ni duplica actividades', () => {
    const mezclado = shuffleWithSeed(lote, 77);

    expect(mezclado).toHaveLength(lote.length);
    expect(mezclado.map((a) => a.id).sort()).toEqual(
      lote.map((a) => a.id).sort(),
    );
  });

  it('no altera el array de entrada', () => {
    const original = lote.map((a) => a.id);
    shuffleWithSeed(lote, 77);

    expect(lote.map((a) => a.id)).toEqual(original);
  });
});

describe('R6 (77-jev-quality-backtest #77): fichero de etiquetado a ciegas', () => {
  const fichero = buildLabelingFile(shuffleWithSeed(lote, 77), 77);

  it('no filtra el quality, el vendedor, el cliente ni la franja de origen', () => {
    for (const prohibido of [
      'quality',
      'seller_id',
      'VENDEDOR-UUID-7f3a',
      'client_id',
      'franja',
      'alta',
      'media',
      'baja',
    ]) {
      expect(fichero).not.toContain(prohibido);
    }
    expect(fichero).not.toMatch(/\b(100|80|60|40|20)\b/);
  });

  it('muestra los cuatro campos de texto de cada actividad', () => {
    for (const actividad of lote) {
      expect(fichero).toContain(actividad.summary as string);
      expect(fichero).toContain(actividad.discovery as string);
      expect(fichero).toContain(actividad.agreement as string);
      expect(fichero).toContain(actividad.next_step as string);
    }
  });

  it('ofrece una casilla por nivel del 1 al 4 en cada actividad', () => {
    const casillas = fichero.match(/\[ \] 1 {2}\[ \] 2 {2}\[ \] 3 {2}\[ \] 4/g);

    expect(casillas).toHaveLength(lote.length);
  });

  it('incluye la escala de R7 literal y la semilla usada', () => {
    for (const nivel of LEVELS) {
      expect(fichero).toContain(nivel);
    }
    expect(fichero).toContain('Semilla: 77');
  });

  it('sigue el orden aleatorizado, no el de la estratificacion', () => {
    const orden = shuffleWithSeed(lote, 77).map((a) => a.summary as string);
    const posiciones = orden.map((s) => fichero.indexOf(s));

    expect(posiciones).toEqual([...posiciones].sort((a, b) => a - b));
    expect(orden).not.toEqual(lote.map((a) => a.summary as string));
  });
});

describe('R6 (77-jev-quality-backtest #77): lectura del fichero etiquetado', () => {
  it('recupera el nivel marcado por el director en cada posicion', () => {
    const marcado = fichero_marcado();

    expect(parseLabelingFile(marcado)).toEqual([
      { orden: 1, nivel: 3 },
      { orden: 2, nivel: 1 },
      { orden: 3, nivel: null },
    ]);
  });
});

function fichero_marcado(): string {
  return [
    '# Etiquetado',
    '',
    '## 1',
    '- Resumen: uno',
    'Nivel: [ ] 1  [ ] 2  [x] 3  [ ] 4',
    '',
    '## 2',
    '- Resumen: dos',
    'Nivel: [X] 1  [ ] 2  [ ] 3  [ ] 4',
    '',
    '## 3',
    '- Resumen: tres',
    'Nivel: [ ] 1  [ ] 2  [ ] 3  [ ] 4',
    '',
  ].join('\n');
}

describe('R6 (77-jev-quality-backtest #77): el etiquetado tiene que cuadrar con el lote', () => {
  const bloque = (orden: number, nivel: number | null) =>
    [
      '---',
      '',
      `## ${orden}`,
      '',
      '- Resumen: texto',
      '',
      `Nivel: ${[1, 2, 3, 4]
        .map((k) => `[${k === nivel ? 'x' : ' '}] ${k}`)
        .join('  ')}`,
      '',
    ].join('\n');

  const fichero = (bloques: string[]) =>
    ['# Etiquetado', '', ...bloques].join('\n');

  it('no se queja de un fichero completo y bien numerado', () => {
    const etiquetas = parseLabelingFile(
      fichero([bloque(1, 3), bloque(2, 1), bloque(3, 4)]),
    );

    expect(validarEtiquetado(etiquetas, 3)).toEqual([]);
  });

  it('un bloque sin marcar no es un error: es una actividad sin etiqueta', () => {
    const etiquetas = parseLabelingFile(
      fichero([bloque(1, 3), bloque(2, null), bloque(3, 4)]),
    );

    expect(validarEtiquetado(etiquetas, 3)).toEqual([]);
  });

  it('avisa de cuantos bloques faltan y de cuales', () => {
    const etiquetas = parseLabelingFile(fichero([bloque(1, 3), bloque(3, 4)]));
    const problemas = validarEtiquetado(etiquetas, 3);

    expect(problemas.join(' ')).toContain('2 bloques');
    expect(problemas.join(' ')).toContain('3 actividades');
    expect(problemas.join(' ')).toContain('faltan');
    expect(problemas.join(' ')).toContain('2');
  });

  it('avisa de una posicion repetida', () => {
    const etiquetas = parseLabelingFile(
      fichero([bloque(1, 3), bloque(2, 1), bloque(2, 4)]),
    );
    const problemas = validarEtiquetado(etiquetas, 3);

    expect(problemas.join(' ')).toContain('repetidas');
    expect(problemas.join(' ')).toContain('2');
  });

  it('avisa de una posicion que el lote no tiene', () => {
    const etiquetas = parseLabelingFile(
      fichero([bloque(1, 3), bloque(2, 1), bloque(9, 4)]),
    );
    const problemas = validarEtiquetado(etiquetas, 3);

    expect(problemas.join(' ')).toContain('no tiene');
    expect(problemas.join(' ')).toContain('9');
  });

  it('caza el bloque fantasma que crea una linea de texto que empieza por ##', () => {
    const conFantasma = fichero([
      bloque(1, 3),
      bloque(2, 1),
      bloque(3, 4),
    ]).replace(
      '- Resumen: texto',
      '- Resumen: el cliente pidio\n## 2 unidades',
    );

    const problemas = validarEtiquetado(parseLabelingFile(conFantasma), 3);

    expect(problemas).not.toEqual([]);
  });
});
