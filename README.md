# SismoPaz — Sprint 1

Aplicación de consulta del catálogo sísmico de La Paz con Next.js App Router, PostgreSQL y PostGIS. La interfaz permite explorar eventos por fecha, ubicación y magnitud, visualizar epicentros y consultar una ficha técnica.

## Requisitos

- Node.js 20.9 o superior y npm.
- Docker Desktop con el motor iniciado y Docker Compose.
- Conexión a Internet para descargar dependencias, imagen de base de datos y teselas de OpenStreetMap.

## Estructura

La aplicación Next.js canónica está en **`frontend/`** (incluye `.env.local` y sus pruebas). La raíz es el workspace: contiene `backend/`, `db/`, `docker-compose.yml` y los scripts que delegan a `frontend/`. No hay una segunda copia de `app/`, `components/`, `lib/` ni `tests/` en la raíz.

## Ejecutar en desarrollo

Desde esta carpeta, en PowerShell:

```powershell
npm install
docker compose up -d --wait
npm run db:migrate
npm run dev
```

`npm run dev` equivale a `next dev frontend -p 3001`; abra http://localhost:3001 (el backend NestJS usa el puerto 3000). Para detener la aplicación use `Ctrl+C` y para detener la base de datos `docker compose stop`. El volumen persiste entre reinicios. El esquema y la carga de ejemplo solo se aplican al crear el volumen por primera vez; para bases existentes use `npm run db:migrate` y `npm run db:seed`.

Si prefiere trabajar dentro de la app:

```powershell
cd frontend
npm run dev
```

El frontend usa el puerto 3001 en los ejemplos de integración; ajuste `TEST_BASE_URL` si usa otro puerto.

## Datos y alcance

**Los registros incluidos son ficticios y están identificados como demostración.** No se ha conectado una fuente oficial ni existe actualización automática. Las ubicaciones son etiquetas registradas, no una clasificación espacial automática. La distancia al área urbana usa un **radio de referencia de 10 km** alrededor de Plaza Murillo cargado por la migración 002; es una aproximación documentada, no un límite oficial, y la ficha técnica lo advierte. Consulte [datos y límites](db/README.md) para cargar registros y geometrías, y antes de cualquier uso operativo.

El catálogo usa coordenadas WGS 84 (EPSG:4326); el mapa base utiliza Web Mercator (EPSG:3857). Las fechas de filtro representan días completos de Bolivia; las horas de los eventos se muestran en UTC y BOT. La lista está paginada en PostgreSQL, y el mapa muestra hasta 5.000 resultados con aviso cuando se supera ese límite. El catálogo público se acota a ubicaciones del departamento de La Paz y los conteos de 24/48 h respetan los filtros activos.

## Comprobación

```powershell
npm run typecheck
npm run build
npm test
```

Las pruebas de integración requieren la base de datos y el servidor local activos en `http://localhost:3001`; véase `frontend/tests/integration/api.test.mjs`. Para probar un build aislado en otro puerto, ajuste `TEST_BASE_URL`.

El diseño toma como referencia el manual proporcionado. Los requisitos y atributos de calidad orientan el trabajo con ISO/IEC/IEEE 29148:2018 e ISO/IEC 25010:2023; esta implementación no representa una certificación de conformidad.
