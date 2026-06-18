# Sesion Activa

**Feature en progreso**: ninguna
**Iniciada**: -
**Agente**: -

## Plan de la sesion

Feature `38-activity-lifecycle` completada.

## Decisiones tomadas

- status = varchar default 'Pendiente' (no PG enum)
- Opción A: 5 actividades del mismo cliente → 1 deal compartido; deal avanza manual en Kanban
- changedBy del JWT, newStatus validado con @IsIn en DTO

## Bloqueantes

_(ninguno)_

## Proximos pasos

Commit de la feature y continuar con siguiente item del backlog.
