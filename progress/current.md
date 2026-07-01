# Sesion Activa

**Feature en progreso**: ninguna
**Iniciada**: -
**Agente**: -

## Plan de la sesion

Feature `44-task-delete` completada.

## Decisiones tomadas

- Ownership check calcado de reactivate/update/complete (task.sellerId !== sellerId -> Forbidden), sin diferenciar por rol
- softDelete reutilizado tal cual (ya existia generico en TaskRepositoryImpl via IRepository), sin tocar ese archivo
- Boton Eliminar visible siempre (Pendiente y Completada), fuera del condicional de status en TaskCard.tsx
- mi-dia/** fuera de alcance (solo importa TYPE_TAG, no el componente TaskCard)

## Bloqueantes

_(ninguno)_

## Proximos pasos

Commit de la feature (pendiente, lo hace el usuario). Sin siguiente item de backlog definido — feature_list.json sin pendientes.
