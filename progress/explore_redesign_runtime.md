# Explore: runtime local para screenshots del rediseño

Fecha: 2026-10-09. Investigación de solo lectura: no se arrancó, paró ni modificó ningún contenedor, volumen o red. Tampoco se leyó `.env` (el clasificador bloqueó incluso leer solo las claves; ver Riesgos).

## 1. Contenedores en el host: no hay ningún stack dev de este repo

Evidencia: `docker ps` + labels `com.docker.compose.*` / `com.docker.swarm.service.name`.

| Contenedor | Origen (label) | Puertos en host |
|---|---|---|
| `tracker-sales-api`, `tracker-sales-ui`, `tracker-sales-nginx` | compose `tracker-sales-os-trackersalesos-qfvalh`, `config_files=/etc/dokploy/compose/.../docker-compose.prod.yml` → **PRODUCCIÓN (Dokploy)** | ninguno (solo 3000/80 internos) |
| `tracker-sales-os-trackersales-hibdzn.1...` (postgres 5432) | servicio swarm de Dokploy → **DB de PRODUCCIÓN** | ninguno |
| `tracker-backend-*`, `tracker-admin-*`, `tracker-planner-*`, `kavak-*`, `dokploy*` | servicios swarm de Dokploy (otros proyectos) | `dokploy` publica 0.0.0.0:3000 |
| `pet-tracker-*`, `n8n-*`, `traefik-*`, proxies | otros proyectos | 80, 443, 4566, 5433 |

- Los contenedores dev (`tracker-sales-*-dev`, definidos en `docker-compose.override.yml`) **no existen**, ni corriendo ni parados (`docker ps -a`).
- No existe un volumen dev (`tracker-sales-os_postgres_data`), ni imágenes dev, ni la red `tracker-sales-network-dev`. La única red es `tracker-sales-network`, que es la de prod.
- Conclusión: **la única API Tracker Sales que hay en este host es la de producción**, y además no está publicada en ningún puerto del host. No se debe usar.

Puertos en escucha (`ss -ltn`): 22, 53, 80, 443, 2377, 3000 (Dokploy), 3002, 3003, 3004 (procesos de otro usuario), 3306 (MySQL, loopback), 4566, 5432 (PostgreSQL del host, loopback), 5433, 7946, 33060, y 43035/43921 (codex).
**Puertos libres confirmados: 3001, 3005, 5434, 5173, 5180, 8085, 4173.**

## 2. Cómo encuentra el frontend la API

- `frontend/src/shared/lib/axios.ts:3-6`: `baseURL = (import.meta.env.VITE_API_URL ?? '') + '/api'`.
- `frontend/vite.config.ts`: proxy `'/api' → http://localhost:3000`. **En este host el 3000 es Dokploy.** Si `VITE_API_URL` no se define, las llamadas `/api` van a parar al panel de Dokploy. Hay que definir siempre `VITE_API_URL`.
- No existe `frontend/.env*`. El `.env.example` de la raíz trae `VITE_API_URL=http://localhost:3000` y `FRONTEND_URL=http://localhost:3001`.
- Backend (`backend/src/main.ts`): prefijo global `api`, `PORT || 3000`, CORS `origin = FRONTEND_URL || 'http://localhost:3001'`. Con un `VITE_API_URL` absoluto, el origen de Vite tiene que coincidir exactamente con `FRONTEND_URL`.
- `app.module.ts`: `ConfigModule envFilePath '.env'`, relativo al cwd. `backend/` no tiene `.env` (solo `.env.example`), y las variables de entorno del proceso tienen prioridad. JWT usa por defecto `'changeme'`, y las claves de IA son opcionales para arrancar.
- Puertos dev según el override: db 5434, api 3005, ui 3001, nginx 8085 (solo con el perfil `nginx`).

**Login de dev**: `backend/src/modules/auth/application/use-cases/seed.use-case.ts` crea `admin / Admin123!` en `onApplicationBootstrap` **si la tabla `users` está vacía, en cualquier entorno, incluido prod**. Es un seed por defecto, no exclusivo de dev. En una DB local nueva funciona. `progress/qa_smoke_2026-06-11.md` dice que en otra DB esa contraseña ya se había cambiado. **No probar esa credencial contra prod.**
- Migraciones: `TYPEORM_MIGRATIONS_RUN=true` crea el schema completo en una DB vacía. Validado en `progress/impl_46-schema-migrations-reconcile.md:42`, incluida la extensión `uuid-ossp`.
- Smoke previo (`plans/README.md:26-28`): "Docker real (api+db+ui+nginx) y admin/Admin123!, Chrome 1440x900". En este host no queda rastro de ese stack, así que probablemente se ejecutó en otro entorno.

## 3. Procedimiento recomendado (cada paso que toca docker o la red requiere aprobación del usuario)

Idea: una DB desechable aislada en loopback, el backend nativo con env inline (sin compose, sin build de imágenes) y Vite en loopback. Nada de esto toca las redes, nombres ni puertos de prod.

```bash
# 0) [aprobación: red] Falta una dependencia del frontend: reicon-react (la importa
#    shared/components/Icon.tsx) no está en node_modules, así que Vite fallaría.
#    Solo toca frontend/node_modules.
cd /home/claude/sites/Tracker-Sales-OS/frontend && pnpm install --frozen-lockfile

# 1) [aprobación: docker] DB efímera solo en loopback, en la red bridge por defecto
#    (no en tracker-sales-network). postgres:17-alpine ya está en local;
#    15-alpine requeriría pull.
docker run -d --name tracker-sales-db-screens --label purpose=redesign-screens \
  -e POSTGRES_USER=tracker -e POSTGRES_PASSWORD=tracker123 -e POSTGRES_DB=tracker_sales_os \
  -p 127.0.0.1:5434:5432 postgres:17-alpine

# 2) Backend nativo en 3005. Las migraciones crean el schema y el seed crea admin/Admin123!
cd /home/claude/sites/Tracker-Sales-OS/backend && env PORT=3005 NODE_ENV=development \
  POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=5434 POSTGRES_USER=tracker POSTGRES_PASSWORD=tracker123 \
  POSTGRES_DB=tracker_sales_os JWT_SECRET=$(openssl rand -hex 32) JWT_REFRESH_SECRET=$(openssl rand -hex 32) \
  FRONTEND_URL=http://localhost:3001 TYPEORM_MIGRATIONS_RUN=true TYPEORM_SYNCHRONIZE=false \
  pnpm start:dev
# check: curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3005/api/docs   → 200

# 3) Frontend en 3001: coincide con el FRONTEND_URL/CORS por defecto; Vite escucha solo en localhost
cd /home/claude/sites/Tracker-Sales-OS/frontend && VITE_API_URL=http://localhost:3005 pnpm dev --port 3001 --strictPort

# 4) (Opcional) Datos de muestra para no fotografiar estados vacíos:
#    usar los POST de progress/QUICK_SETUP_JSONS.md contra http://localhost:3005/api

# Teardown
#   Ctrl-C en el backend y en Vite; luego:
docker rm -f -v tracker-sales-db-screens
```

"Antes" y "después": ejecutar en secuencia sobre el mismo puerto 3001 (CORS admite un solo origen). Se fotografía `main`, se cambia de rama o se aplica el rediseño, Vite hace HMR y se vuelve a fotografiar. La DB y la API son las mismas en ambas tandas, así que los datos son idénticos.

Alternativa B (no recomendada): `docker compose -p tracker-sales-dev` con el override. Construye imágenes, y si `.env` contiene `PORT=3005`/`POSTGRES_PORT=5434`, como dice el comentario del override, el `env_file` los inyecta *dentro* del contenedor: la API escucharía en 3005 con el mapeo apuntando a :3000, y conectaría a `postgres:5434`. Sería necesario un override extra con `PORT: 3000` y `POSTGRES_PORT: 5432`. No se pudo verificar porque `.env` no se leyó.

## 4. Playwright: disponible, sin instalar nada

- En caché: `~/.cache/ms-playwright/chromium_headless_shell-1234` (con `INSTALLATION_COMPLETE` y `DEPENDENCIES_VALIDATED`).
- Versión correspondiente: **playwright 1.62.0** (`browsers.json` → chromium-headless-shell revision `1234`, Chrome 151.0.7922.34). Está en disco en
  `PW=/home/claude/sites/odc/frontend/node_modules/.pnpm/playwright@1.62.0/node_modules/playwright`.
  No hay copias globales ni en `~/.npm/_npx`.
- **Verificado**: `node $PW/cli.js screenshot` generó un PNG de una URL `data:` en el scratchpad.

Captura suelta (sin sesión):
```bash
PW=/home/claude/sites/odc/frontend/node_modules/.pnpm/playwright@1.62.0/node_modules/playwright
node $PW/cli.js screenshot --viewport-size=1440,900 --wait-for-timeout=1500 --full-page http://localhost:3001/login login.png
```

Capturas autenticadas: script CJS en el scratchpad. Los campos de login son `input[name=username]`, `input[name=password]` y `button[type=submit]` (`LoginPage.tsx:98-129`).
```js
// shots.cjs — node shots.cjs <outDir> [baseUrl]   (crear outDir antes)
const { chromium } = require('/home/claude/sites/odc/frontend/node_modules/.pnpm/playwright@1.62.0/node_modules/playwright');
const [out = 'shots', base = 'http://localhost:3001'] = process.argv.slice(2);
const routes = ['dashboard','mi-dia','pipeline','clientes','agenda','ventas','reportes','coaching','equipo','configuracion','import-export'];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`${base}/login`); await p.screenshot({ path: `${out}/login.png` });
  await p.fill('input[name=username]', 'admin'); await p.fill('input[name=password]', 'Admin123!');
  await Promise.all([p.waitForURL(u => !u.pathname.startsWith('/login')), p.click('button[type=submit]')]);
  for (const r of routes) { await p.goto(`${base}/${r}`, { waitUntil: 'networkidle' }); await p.screenshot({ path: `${out}/${r}.png`, fullPage: true }); }
  await b.close();
})();
```

## Riesgos abiertos

1. **Nest escucha en todas las interfaces** (`app.listen(port)` sin host), así que la API dev en :3005 queda expuesta a la IP pública mientras corre, con `admin/Admin123!`. Solo contiene datos ficticios, pero conviene revisar `sudo ufw status` antes, o mantenerla levantada solo durante las capturas. La DB y Vite quedan en loopback.
2. **No ejecutar nunca `docker compose up/down` con solo `docker-compose.yml`**: usa los mismos `container_name` y la misma red (`tracker-sales-network`) que prod. Los contenedores dev se unirían a la red de prod y `down` intentaría borrarla.
3. Proxy de Vite → `localhost:3000` = Dokploy. Sin `VITE_API_URL`, el login intentaría hacer POST al panel de Dokploy.
4. `.env` raíz no verificado (lectura denegada). El procedimiento recomendado no lo usa: el backend corre desde `backend/`, que no tiene `.env`, y todas las variables van inline.
5. En modo dev, las devtools de TanStack Router/Query aparecen como botones flotantes en las capturas. Salen igual en antes y después; si molestan, usar `pnpm build && pnpm preview --port 4173` (necesita `VITE_API_URL` en el build y `FRONTEND_URL=http://localhost:4173`).
6. `backend/dist/` lo reescribe `nest start --watch`. Es un artefacto local; prod se construye desde `/etc/dokploy/...`, no desde aquí.
7. La DB nueva está vacía: sin el paso 4, la mayoría de las pantallas muestran estados vacíos.
