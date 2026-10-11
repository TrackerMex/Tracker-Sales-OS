# Sesión cerrada — corrección de registro de actividades

**Fecha**: 2026-10-11.
**Rama**: fix/bugs-pendientes, base dev 47595dc; destino dev.
**Feature completada**: 89-activity-task-client-sync.

El usuario confirmó el error «La actividad debe conservar el cliente de la tarea» desde Actividades al elegir una tarea. El formulario conservaba el cliente anterior. Ahora elegir/cambiar tarea sincroniza su cliente y nombre, limpia contacto/oportunidad incompatibles y resuelve contactos por ID exacto. Cambiar manualmente a otro cliente desvincula la tarea incompatible con un aviso visible; quitar sólo la tarea conserva el cliente. Agenda/Mi Día mantienen dueño y cliente de la tarea completada. La validación backend permanece intacta.

Ciclo completo: reproducción previa 16/16 → implementación delegada → review independiente PASSED 5/5 → QA final 158/158. Se verificaron 33 guardados reales, respuestas tardías, tareas sin cliente, actividad sin tarea, EditTaskForm y 22 rechazos sin escrituras. Frontend tsc/typecheck/lint/build y diff-check PASS. Sólo dos archivos de producto cambiaron; 389 fuentes protegidas permanecen intactas. Evidencia en progress/impl_89-activity-task-client-sync.md, progress/review_89-activity-task-client-sync.md y progress/qa_89-activity-task-client-sync.md.

Los lotes 82–88 siguen completados y verificados; su evidencia permanece en progress/qa_82-88-bugfixes.md. QA exclusivo en UI 3001/API 3005/DB 5434. Main y despliegue de producción quedan pendientes de su paso separado. Los archivos previos no versionados de progress/ se conservan.
