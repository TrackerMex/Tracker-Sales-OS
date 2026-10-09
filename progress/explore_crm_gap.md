# Exploración: brechas para un CRM completo (2026-10-09)

Objetivo del usuario: que Tracker Sales OS sea un CRM completo, vendible en torno a 10.000 €, tomando como referencia la plantilla https://github.com/shadcndashboard/next-shadcn-dashboard.

## La plantilla de referencia

- Stack: Next.js 16 (App Router), React 19, Tailwind v4, shadcn sobre **Base UI** (no Radix), Recharts, TanStack Table. Sin auth real, sin i18n, sin formularios con validación.
- Licencia MIT, pero el README pide un enlace de atribución en el footer si se usa su código.
- **La versión gratuita no trae páginas de CRM.** Trae un dashboard "Modern", Blog, Notes, Tickets, una tabla, un formulario, perfil de usuario y pantallas de auth. Contacts, Kanban, Calendar, Email, Chat, Invoice, Customers, Account Settings, RBAC, Integrations y API Keys son **Pro** (demo aparte, de pago).

Conclusión: no se migra a Next.js ni se copian componentes (stack distinto: Vite + TanStack Router, primitivas distintas). La plantilla sirve como **referencia visual** de layout, tarjetas de KPI, tablas y patrones de páginas.

## Lo que el proyecto ya tiene (feature_list.json, 72 de 77 done)

Clientes y contactos (anidados en cliente), actividades con puntos, tareas, agenda y calendario (personal y de equipo), pipeline kanban con forecast ponderado, deals estancados y win/loss, ventas, dashboard de KPIs con semáforo, leaderboard, Mi Día, coaching con IA (Claude), reportes ejecutivos con enlace compartible, settings, import/export, RBAC (Admin/Director/Seller), refresh tokens, CI, paleta de comandos (`shared/components/command/CommandPalette.tsx`), theme provider y DataTable de TanStack ya instalado.

Pendientes: 64 logging estructurado, 65 backups de DB en prod, 66 multi-tenancy, 77 (in_progress), 80.

## Brechas frente a un CRM comercial

Verificado en código:

1. **Vista global de contactos.** Solo existe `ClientesPage.tsx`; los contactos se ven dentro de cada cliente. (Plantilla Pro: Contacts.)
2. **Catálogo de productos y cotizaciones.** No hay módulo de cotizaciones ni de facturas; `sales` solo registra la venta. (Plantilla Pro: Invoice.)
3. **UI de auditoría.** La entidad `audit_logs` existe en backend, pero no hay pantalla.
4. **Multi-tenancy, logging y backups** (64, 65, 66): sin ellos no se puede vender a más de un cliente.

Sin verificar (no se revisó el código):

5. Centro de notificaciones (hoy solo existe el badge de tareas vencidas, feature 22).
6. Perfil de usuario y cuenta (avatar, cambio de contraseña).
7. Adjuntos y documentos por cliente o deal.
8. Integración de email (Gmail/Outlook): es grande, con OAuth; se deja fuera de la primera ronda.

## Sobre el valor de 10.000 €

El precio no lo fijan las pantallas, sino quién lo compra y qué riesgo asume. Lo que más sube el valor vendible de este repo:

- Multi-tenancy (66): un mismo despliegue para varias empresas.
- Backups y logging (65, 64): confianza para producción.
- Cotizaciones (brecha 2): conecta pipeline con ingresos, que es lo que pagan los equipos comerciales.
- Datos demo y onboarding: que un comprador lo pruebe en minutos.

## Roadmap propuesto (pendiente de aprobación del usuario)

Orden sugerido, una feature a la vez según CLAUDE.md:

| Orden | Feature | Por qué primero |
|---|---|---|
| 0 | Cerrar 77 y 80 | Ya están en curso; la regla es una feature a la vez |
| 1 | 65 backups de DB en prod | Hay datos reales en producción sin backup automatizado |
| 2 | 64 logging estructurado | Necesario para operar varios clientes |
| 3 | 66 multi-tenancy (org_id) | Condición para vender a más de una empresa |
| 4 | Nueva: catálogo de productos + cotizaciones (PDF), ligadas a deal y venta | Mayor brecha funcional de CRM |
| 5 | Nueva: vista global de contactos (DataTable con filtros, orden y columnas) | Patrón Contacts/Customers de la plantilla |
| 6 | Nueva: centro de notificaciones (tareas vencidas, deals estancados) | Reutiliza features 20 y 22 |
| 7 | Nueva: perfil de usuario y cuenta | Patrón User Profile / Account Settings |
| 8 | Nueva: UI de auditoría (solo Admin) | La entidad ya existe |
| 9 | Nueva: rediseño visual del dashboard tomando la plantilla como referencia | Último: estética sobre funcionalidad ya completa |

Antes de implementar las features 4 a 9 hay que registrarlas en `feature_list.json` con su checkpoint en `CHECKPOINTS.md`.
