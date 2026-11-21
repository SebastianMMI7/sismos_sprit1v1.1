# Documentación de Entrega — Sprint 1
## SismoPaz / MapaSismos — Mapa Sísmico y Eventos Geográficos de La Paz

> **Equipo:** Grupo 4 — Analisis y Diseño de Sistemas II  
> **Fecha:** 21/11/2026  
> **Estado:** Sprint 1 completado y verificado  
> **Aplicación canónica:** `frontend/` (Next.js App Router, puerto 3001)

---

## 1. Resumen del alcance

El **Sprint 1** consiste en un sistema de consulta del catálogo sísmico de la región de La Paz. Permite visualizar epicentros en un mapa interactivo georreferenciado, consultar un listado ordenado de eventos, aplicar filtros de ubicación/fecha/magnitud y ver la ficha técnica de cada sismo.

**No es un sistema de alerta en tiempo real.** Las alertas activas y notificaciones inmediatas corresponden al **Sprint 2 (RF2.01)**.

---

## 2. Requisitos Funcionales cumplidos (RF1.01 – RF1.04)

| Requisito | Nombre | Estado | Cómo se implementó |
|-----------|--------|--------|--------------------|
| **RF1.01** | Despliegue Cronológico de Eventos Sísmicos | ✅ Cumple | Listado en `frontend/app/page.tsx` ordenado del más reciente al más antiguo (`ORDER BY e.occurred_at DESC`). Incluye fecha/hora UTC y BOT, magnitud, profundidad, macrodistrito/municipio, paginación en servidor y aviso informativo si no hay eventos en ventana 24/48 h. |
| **RF1.02** | Cartografía Georreferenciada de Eventos | ✅ Cumple | Mapa Leaflet/OpenStreetMap en `frontend/components/SeismicMap.tsx` con datum WGS 84 (EPSG:4326). Marcadores tipo `CircleMarker`: diámetro proporcional a la magnitud (`magnitud * 3`, limitado 3–24 px) y color por profundidad focal: superficial 0–30 km = naranja, intermedia 31–70 km = azul cielo, profunda >70 km = gris. Popup con resumen al hacer clic. |
| **RF1.03** | Consulta de Ficha Técnica Individual | ✅ Cumple | Modal de detalle (`frontend/app/page.tsx`, componente `Detail`) con magnitud tipificada (Mw/Ml), profundidad, coordenadas lat/long en grados decimales, hora exacta UTC y BOT, distancia epicentral a Plaza Murillo, distancia al área urbana (`urbanAreaDistanceKm`), fuente (`source`) y mapa contextual centrado en el evento con zoom adaptativo (magnitud ≥5 → zoom 8, si no → zoom 10). |
| **RF1.04** | Búsqueda y Filtrado Espaciotemporal | ✅ Cumple | Filtros combinados en `frontend/app/page.tsx` + `frontend/lib/catalog.ts`: ubicación (macrodistrito/municipio), intervalo de fechas (interpretado en hora local Bolivia), rango de magnitudes (0–10), paginación servidor, acción "Restablecer filtros", respuesta asíncrona y mapa/lista reactivos. |

---

## 3. Requisitos No Funcionales cumplidos (RNF)

| Requisito | Nombre | Estado | Evidencia |
|-----------|--------|--------|-----------|
| **RNF01** | Eficiencia de desempeño | ✅ Parcial | Consultas con índice en fecha y ubicación; mapa limitado a 5.000 resultados con aviso de truncación; paginación en servidor. Lighthouse no ejecutado localmente. |
| **RNF02** | Usabilidad y adaptabilidad (responsive) | ✅ Cumple | Interfaz operable desde 360 px (verificado con CDP real). Grid de 12 columnas, botones mínimos 44 px, radios 8 px, transiciones 0.2 s, popups 14 px, H2 24/20 px, contraste WCAG AA. |
| **RNF03** | Seguridad | ✅ Parcial | Backend con bcrypt (coste 12), JWT expiración 60 min, roles de usuario. TLS/HTTPS no verificable en entorno local de desarrollo. |
| **RNF04** | Fiabilidad / disponibilidad | ✅ Parcial | Aislamiento transaccional entre reportes y núcleo cartográfico documentado; esquema versionado sin `synchronize`. Disponibilidad 99.9% no verificable localmente. |
| **RNF05** | Mantenibilidad y modularidad | ✅ Cumple | Clean Architecture, separación Server/Client Components (Next.js App Router), funciones geoespaciales nativas en PostgreSQL + PostGIS, índices GiST. |
| **RNF06** | Precisión cartográfica | ✅ Cumple | Coordenadas WGS 84 (EPSG:4326), validación de rangos latitud [-90,90] y longitud [-180,180], almacenamiento como `geography(Point,4326)`. |

---

## 4. Manual de Diseño UI cumplido

| Especificación del manual | Implementación | Archivo |
|---------------------------|----------------|---------|
| Paleta: Zinc 900, Naranja 500, Rose 600 restringido | Colores base y acento aplicados; rojo solo para alertas severas y botones destructivos | `frontend/app/globals.css`, `DISEÑO/sismopaz_contexto_SKILL.md` |
| H2: 24 px desktop / 20 px mobile | `.section-title h2` con media queries | `frontend/app/globals.css` |
| Metadatos 14 px | Textos secundarios a 14 px | `frontend/app/globals.css` |
| Botones táctiles mínimos 44 px | `min-height: 44px` en botones, controles Leaflet zoom 44×44 | `frontend/app/globals.css` |
| Radios de borde 8 px | `--radius: 8px`, `border-radius: 8px` en paneles, botones, modales | `frontend/app/globals.css` |
| Transiciones 0.2 s | `transition: ... 0.2s ease` en botones, inputs, enlaces | `frontend/app/globals.css` |
| Grid de 12 columnas | `.content-grid { grid-template-columns: repeat(12, minmax(0,1fr)) }` | `frontend/app/globals.css` |
| Mapa mínimo 500 px de alto | `.map-wrap { min-height: 500px }` | `frontend/app/globals.css` |
| Ruta `/mapa` | Página accesible en `frontend/app/mapa/page.tsx` y enlace en sidebar | `frontend/app/mapa/page.tsx` |
| Popup mapa 14 px | `.map-popup { font-size: 14px }` | `frontend/app/globals.css` |
| Modal móvil con una columna | `@media(max-width:600px)` `.detail-grid{grid-template-columns:1fr}` | `frontend/app/globals.css` |
| Restricción de color rojo | Rojo (Rose 600) solo para alertas severas y botones destructivos; no usado en marcadores comunes | `DISEÑO/sismopaz_html_y_ui_kit_consolidado.html`, `frontend/components/types.ts` |

---

## 5. Arquitectura y tecnologías

### Stack tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Frontend | Next.js (App Router) | ^16.4.6 | Interfaz de usuario, rutas API BFF (`/api/*`) |
| Frontend | React | ^19.2.0 | Componentes de UI |
| Mapas | Leaflet + react-leaflet | ^1.9.4 / ^5.0.0 | Mapa interactivo y marcadores |
| Iconos | lucide-react | ^0.468.0 | Iconografía |
| Estilos | Tailwind CSS + CSS global | — | Diseño responsive y tokens |
| Base de datos | PostgreSQL + PostGIS | 17.10 / 3.6.2 | Almacenamiento geoespacial de eventos |
| Backend (opcional) | NestJS + TypeORM | ^10.0.0 | API técnica separada (puerto 3000) |
| Lenguaje | TypeScript | ^5.7.0 | Tipado estático |

### Patrón de API

El frontend usa un **patrón BFF (Backend for Frontend)**: sus propias rutas `/api/events`, `/api/events/[id]`, `/api/locations` consultan PostgreSQL directamente mediante `pg` (Pool). El backend NestJS (puerto 3000) es una API técnica separada ya validada con pruebas e2e, pero **no es requerida para operar el mapa**.

---

## 6. Prerrequisitos (qué instalar antes de ejecutar)

1. **Node.js 20.9 o superior** y npm (verificado: Node v24.22.1 en este entorno).
2. **PostgreSQL 17** con la extensión **PostGIS 3.6.2** instalada y activa.
3. Una base de datos creada (ejemplo: `sismos`) con PostGIS habilitado:
   ```sql
   CREATE DATABASE sismos;
   \c sismos
   CREATE EXTENSION postgis;
   ```
4. Acceso a Internet para descargar dependencias de npm y teselas de OpenStreetMap.

---

## 7. Paso a paso para ejecutar el sistema (en orden)

Todos los comandos se ejecutan desde la raíz del repositorio:
```
C:\Users\sebas\Desktop\II2026\ANALISIS Y DISEÑO DE SITEMA II\SISTEMA DE TERREMOTOS\MapaSismos-master
```

### Paso 7.1 — Instalar dependencias (solo la primera vez)
```powershell
npm install
```

### Paso 7.2 — Configurar variables de entorno

Verifica que exista el archivo `frontend/.env.local` con la conexión a la base de datos. Ejemplo:
```
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/sismos
```
> No commitear este archivo; contiene credenciales locales.

### Paso 7.3 — Aplicar migraciones de base de datos (SQL versionado)
```powershell
npm run db:migrate
```
Esto ejecuta en orden:
- `db/migrations/001_sprint1_hardening.sql` (esquema, índices GiST, restricciones CHECK, departamento)
- `db/migrations/002_la_paz_reference.sql` (7 macrodistritos de La Paz + área urbana referencial de 10 km alrededor de Plaza Murillo)

### Paso 7.4 — Cargar datos de demostración (seed)
```powershell
npm run db:seed
```
Carga 15 eventos ficticios (`source = 'demo'`) y 6 municipios en `db/seed.sql`. Es idempotente (`ON CONFLICT DO NOTHING`).

### Paso 7.5 — Construir el frontend (producción)
```powershell
npm run build
```
Genera la versión de producción de Next.js en `frontend/.next`.

### Paso 7.6 — Levantar el frontend (puerto 3001)
```powershell
npm run start
```
El servidor queda escuchando en `http://localhost:3001`. **Deja esta terminal abierta.**

### Paso 7.7 — (Opcional) Levantar el backend NestJS (puerto 3000)
En una **nueva terminal de PowerShell**:
```powershell
cd backend
npm run build
npm run start:prod
```
Queda en `http://localhost:3000`. El frontend no lo requiere para funcionar, pero está disponible para consultas técnicas.

---

## 8. Guía de usuario — ¿qué hace el usuario para usar el sistema?

### 8.1 Abrir el mapa
1. Abre el navegador en: `http://localhost:3001/mapa`
2. Verás el mapa de La Paz con los epicentros registrados como círculos de colores.
3. El tamaño del círculo indica la magnitud; el color indica la profundidad (naranja = superficial, azul = intermedia, gris = profunda).

### 8.2 Filtrar eventos
1. En el panel lateral izquierdo, usa los filtros:
   - **Ubicación:** selecciona un macrodistrito o municipio (ej. Zona Centro, El Alto, Sur).
   - **Desde / Hasta:** fechas en formato AAAA-MM-DD (hora local de Bolivia).
   - **Magnitud mínima / máxima:** valores entre 0 y 10.
2. La lista y el mapa se actualizan automáticamente al cambiar cualquier filtro.
3. Haz clic en **Restablecer filtros** para limpiar todo y volver al catálogo completo.

### 8.3 Ver la ficha técnica de un sismo
1. Haz clic sobre cualquier marcador en el mapa.
2. Se abre un popup con resumen: magnitud, ubicación, fecha/hora BOT, profundidad y distancia al área urbana.
3. Haz clic en el botón **"Ver ficha técnica"** del popup.
4. Se abre un modal con la ficha completa: magnitud (Mw/Ml), profundidad, coordenadas lat/long (WGS 84), fecha UTC y BOT, ubicación, distancia al área urbana, fuente del dato y un mapa contextual centrado en el evento.

### 8.4 Navegar el catálogo (listado)
1. Desplázate hacia abajo en la página para ver la lista de eventos.
2. Los eventos van del más reciente al más antiguo.
3. Usa la paginación inferior para pasar de página si hay muchos resultados.

### 8.5 Entender los avisos informativos
- Si no hay eventos en las últimas 24/48 horas con los filtros activos, aparece un aviso: *"No se registraron eventos en las últimas X horas."*
- Si existen eventos de demostración, aparece un aviso: *"Los eventos de demostración se identifican como tales y no representan un registro oficial."*
- Si el resultado supera 5.000 eventos, el mapa muestra un aviso de truncamiento.

---

## 9. Alcance y limitaciones del Sprint 1

| ¿Qué hace? | ¿Qué NO hace? |
|------------|---------------|
| Mostrar epicentros registrados en el mapa | Alertas en tiempo real / notificación inmediata de sismos actuales |
| Colorear marcadores por profundidad focal | Marcador rojo por "sismo que pasa ahora" |
| Consultar ficha técnica individual por evento | Monitoreo 24/7 automático |
| Filtrar por ubicación, fecha y magnitud | Conexión a fuente oficial de sismos en vivo |
| Paginación y conteos recientes 24/48 h | Alertas severas con banner rojo (Sprint 2) |

> El color **rojo** (Rose 600 `#E11D48`) está restringido por el Manual de Diseño UI: solo se usa para banners de "Alerta Sísmica Severa" (Sprint 2) y botones de acciones irreversibles. Los marcadores del mapa nunca usan rojo; usan naranja/azul/gris según profundidad.

---

## 10. Comandos rápidos (resumen)

```powershell
# Desde la raíz del repositorio
npm install                    # 1. Instalar dependencias
npm run db:migrate             # 2. Aplicar migraciones SQL (esquema + referencia La Paz)
npm run db:seed                # 3. Cargar datos demo (15 eventos, 6 municipios)
npm run build                  # 4. Construir frontend para producción
npm run start                  # 5. Iniciar Next.js en http://localhost:3001

# Backend opcional (nueva terminal)
cd backend
npm run build
npm run start:prod             # NestJS en http://localhost:3000

# Pruebas de integración (requiere servidor en 3001)
$env:TEST_BASE_URL='http://localhost:3001'
node --test frontend/tests/integration/api.test.mjs
```

---

## 11. Evidencia de pruebas (Sprint 1 cerrado)

| Prueba | Resultado |
|--------|-----------|
| `npm run typecheck` (frontend) | ✅ Exit 0 |
| `npm run typecheck` (backend) | ✅ Exit 0 |
| `npm test` (backend unit) | ✅ 4/4 passed |
| `npm run test:e2e` (backend) | ✅ 5/5 passed |
| `npm run build` (frontend) | ✅ Build OK; rutas `/`, `/mapa`, `/api/events`, `/api/locations` generadas |
| Pruebas de integración frontend (contra servidor temporal 3002) | ✅ 7 passed, 1 skipped, 0 failed |
| Verificación visual 360×640 px | ✅ Sin overflow, H2 20 px, popup 14 px, mapa 500 px |
| Verificación visual 1440×1000 px | ✅ 12 columnas, H2 24 px, mapa 511 px |
| Base de datos replay | ✅ 13 ubicaciones, 15 eventos, 0 filas inválidas, 1 área urbana |

---

## 12. Notas importantes para el equipo

1. **La base de datos debe estar creada y con PostGIS activo antes de correr `db:migrate` y `db:seed`.**
2. **Los datos cargados son de demostración (`source = 'demo'`).** No representan mediciones reales ni alertas oficiales.
3. **El área urbana es un radio de referencia de 10 km alrededor de Plaza Murillo**, no un polígono oficial. Está documentado como aproximación del Sprint 1.
4. **Para ver cambios en el navegador tras editar código:** detener el servidor (`Ctrl+C`), hacer `npm run build` y `npm run start` nuevamente.
5. **Si el puerto 3001 está ocupado:** detener el proceso que lo usa antes de iniciar `npm run start`.

---