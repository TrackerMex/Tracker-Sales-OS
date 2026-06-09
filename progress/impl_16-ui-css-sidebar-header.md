# impl_16-ui-css-sidebar-header

## Cambios por archivo

### frontend/src/index.css
- Añadidas clases `.sb-logo`, `.sb-section`, `.sb-footer` para estructura del sidebar
- Añadida clase `.navbtn` con estados hover y active via CSS puro (sin JS)
- Añadida clase `.navbtn.active::before` para el indicador lateral verde
- Añadida clase `.ni` para iconos SVG del sidebar (opacity, tamaño, flex-shrink)
- Añadida clase `.navbtn.active .ni` para color verde en icono activo
- Añadidas clases `.pipe-col` y `.pipe-col-h` para columnas de pipeline
- Añadidos modificadores `.alert-item.navy/green/red/amber`

### frontend/src/shared/components/layout/Sidebar.tsx
- Logo section: `style={{...}}` reemplazado por `className="sb-logo"`
- Section labels: `style={{...}}` reemplazado por `className="sb-section"`
- Nav links: `Link` con inline styles + onMouseEnter/Leave + `<span>` indicador activo
  reemplazados por `className={\`navbtn\${isActive ? ' active' : ''}\`}` sin handlers JS
- Iconos SVG: añadido `className="ni"` y `strokeWidth` cambiado de `"2"` a `"1.6"` en todos
- Eliminado `<span>` de indicador activo (manejado por `::before` en CSS)
- Eliminado wrapper `<span>` de iconos con estilos inline de opacity/color
- Footer: `style={{...}}` reemplazado por `className="sb-footer"`

### frontend/src/shared/components/layout/Header.tsx
- Botón "Tarea": `style={{...}}` reemplazado por `className="btn-ghost"`
- Botón "Prospecto": `style={{...}}` reemplazado por `className="btn-ghost"`
- Botón "Registrar actividad": `style={{...}}` reemplazado por `className="btn-green"`
- Botón "Salir": `style={{...}}` reemplazado por `className="btn-ghost"`
- Lógica de onClick, routing y demás props sin cambios

## Verificacion
- `npx tsc --noEmit` en frontend: sin errores
