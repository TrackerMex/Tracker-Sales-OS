---
feature: "77-jev-quality-backtest"
status: approved     # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[77-jev-quality-backtest]]

> Rutas relativas a `backend/`. Los tests nombran su requisito como
> `R<n> (77-jev-quality-backtest #77): ...`.
>
> Rellenada tras T0-T5 (`progress/impl_77-jev-quality-backtest.md`). Arnes
> aislado: estos tests corren con `pnpm test:scripts`, no con `pnpm test`
> (design §D9). Verificado por el Lider el 2026-09-22: 78 tests en `pnpm test`
> y 52 en `pnpm test:scripts`, ambos en verde.

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `scripts/jev-backtest/stratify.spec.ts::R1 ...: consulta de solo lectura` | `83daf8a` rojo; `45974c7` verde |
| R2 | `stratify.spec.ts::R2 ...: estratifica 25/15/10` | `83daf8a` rojo; `45974c7` verde |
| R3 | `stratify.spec.ts::R3 ...: excluye actividades sin texto` | `83daf8a` rojo; `45974c7` verde |
| R4 | `request-gate.spec.ts::R4 ...: aprobacion humana antes de salir de la empresa` | `5158331` rojo; `957d606` verde |
| R5 | `request-gate.spec.ts::R5 ...: solo viajan los cuatro campos de texto` | `5158331` rojo; `957d606` verde |
| R6 | `labeling.spec.ts::R6 ...` (orden con semilla fija, fichero a ciegas, lectura del etiquetado) | `6e65405` rojo; `45bbfbf` verde |
| R7 | `labeling.spec.ts` (escala literal en el fichero) + `request-gate.spec.ts` (criterios en orden en la peticion) | `6e65405`,`5158331` rojo; `45bbfbf`,`957d606` verde |
| R8 | `jev-client.spec.ts::R8 ...: consulta al modelo` | `ba52a1c` rojo; `6262965` verde |
| R9 | `jev-client.spec.ts::R9 ...: reintentos con espera exponencial` | `ba52a1c` rojo; `6262965` verde |
| R10 | `jev-client.spec.ts::R10 ...: modo seco` | `ba52a1c` rojo; `6262965` verde |
| R11 | `metrics.spec.ts::R11 ...` (matriz de confusion, acuerdos, agregado del informe) | `adb615f` rojo; `802c0b6` verde |
| R12 | `metrics.spec.ts::R12 ...: tasa de falsos 100` | `adb615f` rojo; `802c0b6` verde |
| R13 | `metrics.spec.ts::R13 ...: veredicto del gate` | `adb615f` rojo; `802c0b6` verde |

## Requisitos sin test automatizado

| Requisito | Cómo se verifica |
|---|---|
| R4 (aprobación humana) | Firma escrita en `progress/explore_jev-backtest.md`. El test de T3 solo cubre el interruptor de entorno, no la decisión. |
| R13 (veredicto) | El test de T5 verifica el cálculo. La confirmación de los dos umbrales antes de correr el lote es un acto humano, registrado en el informe. |
