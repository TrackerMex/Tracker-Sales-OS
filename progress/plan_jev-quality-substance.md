# Plan — Calidad de actividad por sustancia (TypeSafe / Jev)

**Autor**: agente Líder
**Fecha**: 2026-09-22
**Estado**: propuesta, pendiente de aprobación humana
**Features propuestas**: 77, 78, 79, 80 (más 81-82 registradas sin especificar)

---

## 1. El problema real

`quality` de una actividad se calcula así, hoy, en producción:

```ts
// backend/src/modules/activities/application/use-cases/create-activity.use-case.ts
private calculateQuality(input: CreateActivityDto): number {
  let score = 0;
  if ((input.summary?.length ?? 0) > 20) score += 20;
  if ((input.discovery?.length ?? 0) > 15) score += 20;
  if ((input.agreement?.length ?? 0) > 15) score += 20;
  if ((input.nextStep?.length ?? 0) > 8) score += 20;
  if (input.nextDate && input.nextTime) score += 20;
  return score;
}
```

Son cinco comprobaciones de longitud de cadena. Un vendedor que escriba
veinticinco caracteres de relleno en cada campo obtiene `quality = 100`.

Ese número no muere ahí. Alimenta dos consumidores:

- `dashboard/application/use-cases/get-sellers-score.use-case.ts` — la calidad
  pesa **35%** del semáforo de vendedores.
- `dashboard/application/use-cases/get-dashboard-summary.use-case.ts` —
  `AVG(a.quality)` en los KPIs del mes.

El semáforo es el instrumento con el que el director juzga a su equipo, y el
propósito declarado del producto es "visibilidad total del equipo sin
necesidad de llamadas o reportes manuales" (`PRODUCT.md`). Una métrica que se
satisface con la barra espaciadora no da visibilidad: da una cifra tranquila.

**Lo que este plan cambia**: medir si el registro tiene sustancia — un
compromiso concreto del cliente, con fecha y responsable — en lugar de medir
si tiene longitud. No añade una métrica nueva al producto; arregla una que ya
se está usando para tomar decisiones.

## 2. Por qué Jev y no el LLM que ya está integrado

La feature `12-ai-coach` ya integró un LLM generativo (OpenRouter en dev,
Anthropic en prod) detrás del puerto `LLM_PROVIDER`, con `LLM_TIMEOUT_MS` y
fallback a sugerencias por defecto. Ese patrón se reutiliza; no se reinventa.

Pero para esto hace falta otra forma:

| | LLM generativo (12-ai-coach) | Jev (System One) |
|---|---|---|
| Devuelve | texto libre | `score` + `probabilities` + `confidence` |
| Parseo | hay que extraer un número de la prosa | tipado, siempre dentro de los niveles dados |
| Latencia | segundos | ~100 ms |
| Costo entrada | tarifa frontier | $0.042 / 1M tokens |
| Salida | se cobra | sin cargo |

`quality` es un entero que va a una columna `int` y a un promedio SQL. Pedirle
a un modelo generativo que emita un número y parsearlo es la vía frágil.
La primitiva `score` de Jev devuelve un nivel de una lista cerrada, con
distribución de probabilidad y confianza. Es la forma exacta del problema.

Volumen estimado: 20 vendedores × 5 actividades/día × 250 días ≈ 25 000
llamadas/año × ~500 tokens ≈ 12.5M tokens ≈ **$0.52/año**. El costo no es un
criterio de decisión aquí; la precisión en español sí.

## 3. El riesgo que decide todo

Jev se entrena principalmente en inglés. La documentación dice que otros
idiomas "se aceptan pero tienen menor precisión" y recomienda probar antes de
producción. Las actividades de este sistema las escriben vendedores mexicanos,
en español, con jerga comercial y abreviaturas.

Por eso la fase 77 es una prueba offline con derecho a matar el plan entero.
No se escribe una sola línea en `backend/src/modules/` hasta que esa prueba
pase.

## 4. Fases

### F77 — Backtest offline (gate de viabilidad)

**No toca `backend/src/modules/`.** Script suelto en `backend/scripts/`,
lectura de la base de producción, resultados a `progress/`.

- Se extraen 50 actividades reales, estratificadas: ~15 con `quality = 100`,
  ~15 con `quality` intermedio, ~10 con `quality` bajo, ~10 de los vendedores
  que el director considera más y menos rigurosos.
- El director las etiqueta a mano en una escala de 4 niveles, **sin ver** el
  `quality` actual ni la salida de Jev. Una hora de su tiempo.
- El mismo lote pasa por Jev con la pregunta `score` definida abajo.
- Se comparan tres columnas: etiqueta humana, `quality` actual (longitud),
  `score` de Jev.

**Criterio de éxito**: Jev concuerda con el director más que la fórmula de
longitud, y en particular identifica los falsos 100 — actividades que hoy
puntúan perfecto y que el director califica de vacías. Si no los identifica,
el plan se archiva aquí y no se gasta nada más.

Salida: `progress/explore_jev-backtest.md` con la matriz de confusión y el
veredicto.

Costo: ~50 × 500 tokens ≈ 25 000 tokens ≈ menos de un centavo.

### F78 — Puerto, adaptador y escritura en sombra

Solo si F77 pasa. Arquitectura hexagonal, igual que `coaching`:

```
activities/domain/ports/judgment-provider.port.ts      (nuevo)
activities/infrastructure/adapters/jev.adapter.ts      (nuevo)
activities/infrastructure/adapters/noop-judgment.adapter.ts (nuevo, fallback)
```

Puerto propuesto, análogo a `LLM_PROVIDER`:

```ts
export const JUDGMENT_PROVIDER = Symbol('JUDGMENT_PROVIDER');

export interface SubstanceJudgment {
  score: number;        // 0-100, derivado del nivel
  confidence: number;
  level: string;
}

export interface JudgmentProvider {
  scoreActivitySubstance(input: {
    summary: string;
    discovery: string | null;
    agreement: string | null;
    nextStep: string | null;
  }): Promise<SubstanceJudgment | null>;   // null = no disponible
}
```

Migración: dos columnas nuevas en `activities`, siguiendo el patrón de
`src/migrations/<timestamp>-<Nombre>.ts`:

- `quality_substance int null`
- `quality_source varchar` — `'length' | 'jev'`

**`quality` no se toca. El dashboard no se toca.** Se escribe en paralelo y se
observa.

Reglas duras de esta fase:

1. `POST /api/activities` **nunca** espera a Jev. El juicio se dispara después
   de persistir la actividad; si tarda o falla, la actividad ya está guardada.
   Registrar una visita no puede depender de un tercero.
2. Timeout propio `JEV_TIMEOUT_MS` (default 2000), mismo criterio que
   `LLM_TIMEOUT_MS`.
3. Fallo, timeout o `JEV_ENABLED=false` → `quality_substance` queda `null` y
   `quality_source = 'length'`. Nunca una excepción hacia el usuario.
4. `JEV_ENABLED` es interruptor de apagado en caliente, sin desplegar.

Env nuevas en `.env.example`, bajo su propia sección como se hizo con
`ANTHROPIC_API_KEY`: `JEV_API_KEY`, `JEV_TIMEOUT_MS`, `JEV_ENABLED`.

La pregunta, fijada en el adaptador:

```json
{
  "state": {
    "resumen": "...", "descubrimiento": "...",
    "acuerdo": "...", "siguiente_paso": "..."
  },
  "model": "jev-latest",
  "questions": {
    "sustancia": {
      "type": "score",
      "instructions": "Calidad del registro de esta visita comercial B2B, escrito por un vendedor mexicano en español.",
      "criteria": [
        "vacio, relleno o generico sin informacion del cliente",
        "describe lo ocurrido pero sin compromiso del cliente",
        "hay compromiso del cliente pero sin fecha ni responsable",
        "compromiso concreto con fecha y responsable identificados"
      ]
    }
  }
}
```

Los cuatro niveles mapean a 25 / 50 / 75 / 100 para convivir con la escala
actual. El mapeo vive en un solo sitio y queda cubierto por test.

### F79 — Backfill histórico

Precedente en el repo: `1783700000000-BackfillInitiatedClientDeals.ts`, con su
`.spec.ts`. Mismo molde.

Pasa el histórico de `activities` por Jev en lotes y llena
`quality_substance`. Sin cambios de UI, sin riesgo en el flujo en vivo.

El producto de esta fase es un informe para el director: qué vendedores caen y
cuáles suben cuando la calidad se mide por sustancia en vez de por longitud.
Ese contraste es la evidencia con la que se decide F80.

### F80 — Corte: el dashboard consume la señal nueva

Solo con F77 y F79 en la mano, y **con gate humano explícito**: esto mueve el
semáforo que el director ya usa y del que ya tiene una opinión formada.

`get-sellers-score.use-case.ts` pasa a usar `quality_substance` en su
componente del 35%, con `COALESCE` a `quality` cuando sea `null` (histórico no
procesado, o Jev caído). Mismo cambio en el `AVG` de
`get-dashboard-summary.use-case.ts`.

Comunicar a los vendedores antes del corte. Un semáforo que cambia de color de
un día para otro, sin aviso, se lee como un error del sistema.

### F81, F82 — Registradas, sin especificar

- **F81 objeción dominante** (`choice` sobre `discovery`): precio /
  competencia / timing / autoridad / presupuesto / ninguna. Alimenta
  `reports`, el informe ejecutivo mensual. No requiere pedirle nada nuevo al
  vendedor.
- **F82 riesgo de deal estancado** (`noul` sobre últimas N actividades + etapa
  + días sin movimiento): destapa pipeline inflado. La probabilidad calibrada
  ordena por prioridad en lugar de marcar un booleano.

Ambas reutilizan el mismo puerto y adaptador de F78. No se especifican hasta
que F80 esté cerrada.

## 5. Lo que este plan deliberadamente no hace

- No sustituye `calculateQuality` de golpe. Sombra primero, corte después.
- No mete a Jev en el camino crítico de `POST /api/activities`.
- No toca las reglas deterministas de puntos (`TASK_POINTS`) ni la validación
  de campos requeridos por tipo. Eso son reglas exactas y deben seguirlo.
- No añade campos al formulario del vendedor. El texto libre ya existe.
- No construye una abstracción de "proveedor de juicio" genérica con varios
  implementadores. Un puerto, un adaptador real, un no-op de fallback.

## 6. Orden de ejecución y gates

| Fase | Gate para pasar a la siguiente |
|---|---|
| F77 | El director confirma que Jev detecta los falsos 100. Si no: archivar. |
| F78 | Sombra estable, `POST /activities` sin regresión de latencia, Reviewer PASS. |
| F79 | Informe de contraste entregado y leído por el director. |
| F80 | Aprobación humana explícita + aviso al equipo de ventas. |

Nada de esto entra en `backend/src/modules/` antes de que F77 pase.
