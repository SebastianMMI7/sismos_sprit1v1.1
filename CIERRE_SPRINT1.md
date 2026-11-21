# Cierre Sprint 1 — Registro de trabajo y traspaso

> Documento vivo. Si otra persona o modelo retoma el trabajo, debe leer primero esta sección y luego la sección **Cómo continuar**.
> Última actualización: 2026-11-21.

## 1. Objetivo

Cerrar las brechas detectadas en la validación del Sprint 1 de SismoPaz:

1. RF1.03: distancia al área/radio urbano (estado inicial: `null` porque `urban_reference_areas` estaba vacía).
2. Datos de macrodistritos para la delimitación Macrodistrito/Municipio.
3. Índices GiST/fecha/ubicación y restricciones CHECK en la base viva.
4. Desviaciones del Manual de Diseño UI (H2, popup, transiciones, radios, grid, contraste, altura del mapa, `/mapa`).
5. Duplicación `raíz/` vs `frontend/` y rutas de API.
6. Pruebas y evidencia reproducible.

## 2. Estado de partida (validado)

- PostgreSQL 17.10 + PostGIS 3.6.2; base `sismos`.
- `seismic_events`: 12 filas demo; `locations`: 6 municipios; `urban_reference_areas`: 0 filas.
- La BD viva **solo** tiene claves primarias y la FK de `location_id`; no tiene los índices de `db/schema.sql` ni los CHECK de dominio.
- El frontend del puerto 3001 se sirve desde `frontend/` (build de producción `.next/BUILD_ID` del 2026-11-21 16:34). La raíz tiene otra copia idéntica de `app/`, `components/`, `lib/` y `tests/`, pero sin `.env.local` y sin build de producción.
- `/` responde 200; `/mapa` responde 404.
- Pruebas de integración: 6 pasan, 1 omitida, contra `http://localhost:3001`.
- No se deben detener los servidores del usuario en 3000/3001. Para validar builds se usará una copia temporal en otro puerto.

## 3. Decisiones de trabajo

- **Aplicación canónica:** `frontend/`. Es la que tiene `.env.local` y el build que se está sirviendo. La raíz quedará como workspace (dependencias, backend, db) y sus scripts delegarán a `frontend/`.
- **Datos urbanos:** no se presentará un límite inventado como oficial. Se cargará un **área de referencia aproximada y documentada** (buffer alrededor de Plaza Murillo) para que RF1.03 sea funcional y verificable; el nombre/fuente lo indicará explícitamente. Queda registrado como pendiente reemplazarla por una geometría oficial verificada.
- **Macrodistritos:** se cargan los 7 macrodistritos de La Paz como etiquetas (`type='macrodistrito'`). Se añadieron tres eventos demo (`demo-013`, `demo-014`, `demo-015`) asignados a Zona Centro, Cotahuma y Sur para demostrar el filtro.
- **Índices/CHECK:** se aplican con SQL versionado en `db/migrations/` y se documenta el comando. No se dependerá de `synchronize` de TypeORM para el esquema.
- **API:** se mantiene el patrón Next.js BFF (rutas `/api/*` del frontend consultando PostGIS) porque es el que usa la UI y ya está probado. Se documenta como decisión; no se migra la UI a NestJS en este cierre.

## 4. Cambios realizados

_(Se actualiza a medida que se aplican; marcar cada uno con archivo, comando y evidencia.)_

- [x] Documento de traspaso creado.
- [x] Migración SQL de índices/CHECK/departamento.
- [x] Datos de referencia de La Paz (macrodistritos + área urbana referencial).
- [x] Ajustes de API (conteos filtrados, ámbito La Paz).
- [x] Ajustes de diseño UI.
- [x] Ruta `/mapa`.
- [x] Consolidación raíz/frontend.
- [x] Pruebas, build y smoke test.

## 5. Cómo continuar

### 5.1 Rutas y archivos clave

| Elemento | Ruta |
|---|---|
| App canónica | `frontend/` |
| Página principal | `frontend/app/page.tsx` |
| Estilos | `frontend/app/globals.css` |
| Mapa | `frontend/components/SeismicMap.tsx` |
| SQL catálogo | `frontend/lib/catalog.ts` |
| Pool BD | `frontend/lib/db.ts` |
| API events | `frontend/app/api/events/route.ts` |
| API detalle | `frontend/app/api/events/[id]/route.ts` |
| API ubicaciones | `frontend/app/api/locations/route.ts` |
| Pruebas | `frontend/tests/integration/api.test.mjs` |
| Esquema | `db/schema.sql` |
| Migraciones | `db/migrations/` |
| Datos demo | `db/seed.sql` |
| Backend Nest | `backend/` |

### 5.2 Comandos

```powershell
# Desde la raíz del repositorio
npm run typecheck          # usa frontend/tsconfig.json
npm run build              # next build frontend
npm run start              # next start frontend -p 3001

# Migraciones (Node 20+; usa DATABASE_URL o frontend/.env.local)
npm run db:migrate
npm run db:seed

# Validación aislada sin tocar 3001: copie frontend a una carpeta temporal
npx next build .tmp-verify
npx next start .tmp-verify -p 3002
```

Pruebas de integración (con un servidor de prueba en 3002):

```powershell
$env:TEST_BASE_URL='http://localhost:3002'; node --test frontend/tests/integration/api.test.mjs
```

### 5.3 Variables

- `frontend/.env.local` contiene `DATABASE_URL` (credenciales locales de desarrollo).
- `backend/.env` contiene la configuración del NestJS.
- No commitear contraseñas ni `.env.local`.

### 5.4 Rollback

- Los cambios de datos son idempotentes (`IF NOT EXISTS`, `ON CONFLICT`).
- Para quitar los datos de referencia, primero elimine los eventos demo que apuntan a macrodistritos:
  `DELETE FROM seismic_events WHERE id IN ('demo-013','demo-014','demo-015'); DELETE FROM locations WHERE type='macrodistrito'; DELETE FROM urban_reference_areas WHERE id='la-paz';`.
- Para quitar los índices: `DROP INDEX IF EXISTS ...`.
- Los cambios de UI están en archivos versionados; se pueden revertir por archivo.

## 6. Pendientes / riesgos abiertos

- Reemplazar el área urbana referencial por un polígono oficial verificado (municipio/urbanización) y actualizar `source`.
- Verificación visual realizada en 360 y 1440 px; falta una pasada manual en 768 y 1024 px (la retícula colapsa a una columna en 1200).
- Prueba de carga con 5.000+ eventos (no se ejecutó para no alterar la base demo).
- TLS/HTTPS, Lighthouse/axe y disponibilidad no son verificables en local.
- `docker compose config` no se pudo ejecutar porque Docker no está en el PATH de esta máquina; el esquema se validó creando una base temporal con los mismos tres archivos SQL.
- El proceso que sirve 3001 sigue ejecutando el build anterior; hay que reiniciarlo para ver la UI nueva. El proceso NestJS de 3000 también conserva el código anterior en memoria, aunque el código y el e2e ya se validaron.
- Corregida inconsistencia de color: `.deep` en `globals.css` usaba `#7c3aed` (morado) pero `depthColor()` en `types.ts` devuelve `#52525b` (zinc) para >70 km. Ahora coinciden.

## 7. Veredicto de cumplimiento

- **RF1.01, RF1.02 y RF1.04:** cumplen y quedaron verificados contra la base viva y la API.
- **RF1.03:** cumple funcionalmente (`urbanAreaDistanceKm` ya no es nulo y se muestra en ficha/popup), pero la geometría es un **radio de referencia de 10 km**, no un límite oficial. Esta es la única excepción funcional documentada y está señalada en la UI y en `db/README.md`.
- **RNF de rendimiento/consistencia:** índices de fecha, ubicación y GiST, restricciones de dominio, esquema versionado y `synchronize` desactivado.
- **Manual de Diseño UI:** corregidos H2 24/20 px, popup 14 px, transiciones 0.2 s, radios 8 px, mapa flexible con mínimo 500 px, contraste de metadatos/foco, retícula de 12 columnas, espaciado principal en múltiplos de 8 y ruta `/mapa`.
- **Deuda abierta:** polígono urbano oficial, prueba de carga 5.000+, Lighthouse/axe y una pasada manual en 768/1024 px.

## 8. Evidencia final

Ejecución del 2026-11-21 (hora local). Todo se validó en una copia temporal `.tmp-verify` servida en el puerto **3002**, sin tocar los procesos 3000/3001 del usuario.

### 8.1 Base de datos

- `node db/migrate.mjs` aplicó `001_sprint1_hardening.sql` y `002_la_paz_reference.sql` dos veces sin errores.
- Resultado: `event_indexes: 4`, `event_constraints: 5`, `urban_areas: 1`, `macrodistritos: 7`.
- `seismic_events`: 15 filas; `locations`: 13 (6 municipios + 7 macrodistritos); `urban_reference_areas`: 1.
- Área cargada: `Radio urbano de referencia de La Paz (10 km)`, `ST_MultiPolygon`, válida, superficie aproximada 312.3 km², fuente explícita de aproximación.
- Distancias verificadas: `demo-001 = 0.0 km`, `demo-002 = 0.0 km`, `demo-003 = 13.9 km`, `demo-009 = 6.2 km`; 10 eventos dentro y 5 fuera del radio.
- Esquema desde cero validado en base temporal: 13 locations / 7 macrodistritos / 15 events / 1 área / 4 índices; 0 filas inválidas.

### 8.2 Frontend

- `npm run typecheck` en `frontend/` (desde raíz): OK (exit 0).
- `npx next build .tmp-verify`: OK; rutas generadas: `/`, `/mapa`, `/api/events`, `/api/events/[id]`, `/api/locations`, `/_not-found`.
- `node --test frontend/tests/integration/api.test.mjs` contra 3002: **7 passed, 1 skipped, 0 failed**.
- `GET /mapa` y `/`: 200. `GET /api/events?page=0`: 400. `GET /api/events/demo-001`: 200 con `urbanAreaDistanceKm` no nulo.
- CDP real a 360×640: `innerWidth=360`, `scrollWidth=360`, sin overflow; H2 20 px; popup 14 px; radio 8 px; transición 0.2 s; mapa 500 px; 15 marcadores; modal 312 px con una columna y botón cerrar 44×44.
- CDP real a 1440×1000: 12 columnas (`repeat(12,1fr)`), H2 24 px, mapa 511 px, sin overflow; modal 760 px con dos columnas.
- Popup real abierto sobre `demo-001`: incluye `0.0 km del área urbana`; texto a 14 px y CTA táctil.
- Corregida inconsistencia de color: `.deep` en `globals.css` pasó de `#7c3aed` a `#52525b` para coincidir con `depthColor()` en `types.ts` (zinc para >70 km).

### 8.3 Backend

- `npm run typecheck` en `backend/`: OK.
- `npm test`: 4/4 passed.
- `npm run test:e2e`: 5/5 passed, incluida la conexión a PostgreSQL y el catálogo.

### 8.4 Archivos modificados/creados

- Raíz: `package.json`, `README.md`, `docker-compose.yml`, `CIERRE_SPRINT1.md`.
- DB: `db/schema.sql`, `db/seed.sql`, `db/README.md`, `db/migrate.mjs`, `db/seed.mjs`, `db/migrations/001_sprint1_hardening.sql`, `db/migrations/002_la_paz_reference.sql`.
- Backend: `backend/src/app.module.ts`, `backend/src/locations/entities/location.entity.ts`, `backend/src/locations/locations.service.ts`, `backend/src/events/events.service.ts`.
- Frontend: `frontend/package.json`, `frontend/app/globals.css`, `frontend/app/page.tsx`, `frontend/app/mapa/page.tsx`, `frontend/lib/catalog.ts`, `frontend/components/types.ts`, `frontend/components/SeismicMap.tsx`, `frontend/tests/integration/api.test.mjs`.
- La copia duplicada de la raíz (`app/`, `components/`, `lib/`, `tests/`) se movió a `%TEMP%\MapaSismos-root-duplicates-20261121` antes de eliminarla del workspace.

### 8.5 Cómo ver la versión nueva

```powershell
# Desde la raíz
npm run build
npm run start
# Abrir http://localhost:3001/mapa
```

Si el 3001 está ocupado, detenga solo ese proceso de Next (no el backend NestJS de 3000) y vuelva a iniciar. Para una comprobación sin tocar 3001, use una copia y `next start -p 3002`, como se hizo aquí.
