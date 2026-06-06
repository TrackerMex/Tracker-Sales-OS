# AGENTS.md — Roles y Reglas de Agentes

## Agente Líder

**Responsabilidad**: Planifica, coordina, verifica.

**Puede hacer directamente**:
- Leer cualquier archivo del repo
- Editar `feature_list.json`, `progress/`, `docs/`, archivos de configuración raíz
- Lanzar subagentes con prompts específicos
- Responder preguntas conceptuales sobre el proyecto

**NUNCA hace directamente**:
- Editar `backend/src/modules/**` o `frontend/src/modules/**`
- Editar archivos de tests
- Implementar lógica de negocio inline en el chat

**Protocolo de delegación**:
```
Al lanzar un subagente Implementer, el prompt DEBE incluir:
1. Feature ID de feature_list.json
2. Paths exactos de archivos a crear/modificar
3. Interfaces/tipos relevantes (con path)
4. Convenciones de docs/conventions.md
5. Criterio de éxito del CHECKPOINT
6. "Guarda el resumen en progress/impl_<feature-id>.md"
```

---

## Agente Implementer

**Responsabilidad**: Escribe código de negocio en `backend/src/modules/` y `frontend/src/modules/`.

**Recibe del Líder**:
- Feature ID y descripción
- Paths exactos de archivos a crear/modificar
- Tipos e interfaces a usar (no inventar)
- Convenciones del proyecto

**Debe hacer**:
- Leer los archivos de `core/` antes de implementar
- Seguir las convenciones de `docs/conventions.md`
- Escribir el resumen de lo que creó en `progress/impl_<feature-id>.md`
- Correr `tsc --noEmit` al finalizar

**NUNCA hace**:
- Editar archivos en `core/` (esos ya existen)
- Cambiar la estructura de carpetas establecida
- Agregar dependencias sin consultar al Líder

---

## Agente Reviewer

**Responsabilidad**: Valida que la implementación cumple los CHECKPOINTS.

**Recibe del Líder**:
- Feature ID
- Path de `progress/impl_<feature-id>.md` (resumen del Implementer)
- CHECKPOINT correspondiente de `CHECKPOINTS.md`

**Debe hacer**:
- Leer los archivos implementados
- Verificar cada criterio del CHECKPOINT
- Reportar: PASSED / FAILED con detalle
- Si FAILED: listar exactamente qué falta con paths

**NUNCA hace**:
- Editar código directamente
- Dar el PASSED si hay criterios sin verificar

---

## Regla global: Anti-Telephone Game

El código **nunca pasa a través del chat**. Siempre:
- El Implementer escribe a disco
- El Reviewer lee de disco
- El Líder referencia paths, no contenido inline

Esto previene errores de transcripción y mantiene el repositorio como fuente de verdad.
