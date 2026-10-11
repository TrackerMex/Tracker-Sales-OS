# Product

## Register

product

## Users

Director comercial y vendedores de una PME mexicana (5-20 personas de ventas). El director revisa métricas semanalmente y necesita informes ejecutivos para presentar a dirección general. Los vendedores usan el sistema diariamente para registrar actividad, cierres y pipeline.

## Product Purpose

Tracker Sales OS es la plataforma de operación comercial para equipos de ventas B2B en México. Centraliza el registro de ventas por tipo (Vendedor, Dirección Comercial, ATC), gestión de pipeline, actividad diaria y reportes ejecutivos mensuales. El éxito se mide en que el director tenga visibilidad total del equipo sin necesidad de llamadas o reportes manuales.

## Brand Personality

Claro. Moderno. Ordenado.

Desde 2026-10-09 (feature 81) la identidad visual es la de la plantilla [shadcn-dashboard](https://github.com/shadcndashboard/next-shadcn-dashboard) (demo: https://shadcndashboard-demo.vercel.app/), copiada tal cual: colores, tipografía, radios, layout y patrones de página. La marca Tracker se mantiene en los logos oficiales. La voz sigue siendo directa y sin adorno: los datos hablan primero.

Antes de esa fecha el sistema usaba la identidad navy (#002B49) y verde (#82bc00) de Tracker México; ese estilo queda retirado de la app. La lámina ejecutiva conserva navy/verde y Montserrat como excepción documental definida en `DESIGN.md`; el usuario autorizó corregir su adaptación móvil y contraste el 2026-10-11.

## Anti-references

- Mezclar estilos: las pantallas de la app siguen la plantilla; la lámina ejecutiva mantiene la excepción documental de `DESIGN.md`.
- Inventar patrones propios cuando la plantilla ya resuelve el caso (cabecera de página, tarjeta de KPI, tabla, formulario, auth).
- SAP / Salesforce: no complejidad de ERP.

## Design Principles

1. **La plantilla es la fuente de verdad visual** — ante la duda, se replica lo que hace la plantilla. Los detalles están en `DESIGN.md`.
2. **Datos primero** — la información domina el espacio; la chrome de UI queda en segundo plano.
3. **Un patrón por tipo de elemento** — una sola forma de cabecera de página, de tarjeta, de tabla y de formulario en todo el sistema.
4. **Jerarquía clara de rol** — Admin ve todo, Director ve equipo, Vendedor ve su día.

## Accessibility & Inclusion

WCAG 2.1 AA mínimo. Usuarios en pantallas medianas (laptops de 13-15"). Modo claro y oscuro como en la plantilla. Reduced motion respetado (ya implementado).
