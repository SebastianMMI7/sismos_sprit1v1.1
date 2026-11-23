import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import type { MagnitudeType } from './entities/seismic-event.entity';

interface EventRow {
  id: string;
  occurredAt: Date | string;
  magnitude: string | number;
  magnitudeType: MagnitudeType;
  depthKm: string | number;
  latitude: string | number;
  longitude: string | number;
  locationId: string | null;
  locationName: string | null;
  locationType: string | null;
  source: string;
  distanceKm: string | number;
  urbanAreaDistanceKm: string | number | null;
  urbanAreaName: string | null;
  urbanAreaSource: string | null;
}

interface CountRow {
  total: number | string;
}

interface RecentRow {
  last_24: number | string;
  last_48: number | string;
}

export interface SeismicEventResponse {
  id: string;
  occurredAt: string;
  magnitude: number;
  magnitudeType: MagnitudeType;
  depthKm: number;
  latitude: number;
  longitude: number;
  location: { id: string; name: string; type: string } | null;
  epicentralDistanceKm: number;
  urbanAreaDistanceKm: number | null;
  urbanAreaName: string | null;
  urbanAreaSource: string | null;
  source: string;
}

export interface CatalogResponse {
  events: SeismicEventResponse[];
  mapEvents: SeismicEventResponse[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  recentWindow: { hours: number; count: number; count24Hours: number };
  mapTruncated: boolean;
}

/** Punto de referencia Plaza Murillo (La Paz) usado para la distancia epicentral. */
const LA_PAZ_LONGITUDE = -68.1336;
const LA_PAZ_LATITUDE = -16.4956;

const SELECT_EVENT = `
  SELECT ('demo-' || lpad(s.id_sismo::text, 3, '0')) AS id,
         s.fecha_hora_utc AS "occurredAt",
         s.magnitud AS magnitude,
         tm.codigo AS "magnitudeType",
         s.profundidad_km AS "depthKm",
         s.latitud AS latitude,
         s.longitud AS longitude,
         COALESCE(
           CASE WHEN md.id_macrodistrito IS NOT NULL THEN 
             CASE WHEN LOWER(md.nombre) = 'centro' THEN 'zona-centro' ELSE LOWER(REPLACE(md.nombre, ' ', '-')) END
           END,
           CASE WHEN m.id_municipio IS NOT NULL THEN LOWER(REPLACE(m.nombre, ' ', '-')) END
         ) AS "locationId",
         COALESCE(md.nombre, m.nombre) AS "locationName",
         CASE WHEN md.id_macrodistrito IS NOT NULL THEN 'macrodistrito' ELSE 'municipio' END AS "locationType",
         COALESCE(f.nombre, 'demo') AS source,
         ST_Distance(ST_SetSRID(ST_MakePoint(s.longitud, s.latitud), 4326)::geography, ST_SetSRID(ST_MakePoint(${LA_PAZ_LONGITUDE}, ${LA_PAZ_LATITUDE}), 4326)::geography) / 1000 AS "distanceKm",
         ST_Distance(ST_SetSRID(ST_MakePoint(s.longitud, s.latitud), 4326)::geography, urban.area) / 1000 AS "urbanAreaDistanceKm",
         urban.name AS "urbanAreaName",
         urban.source AS "urbanAreaSource"
  FROM sismos s
  LEFT JOIN tipos_magnitud tm ON tm.id_tipo_magnitud = s.id_tipo_magnitud
  LEFT JOIN estados_sismo es ON es.id_estado_sismo = s.id_estado_sismo
  LEFT JOIN macrodistritos md ON md.id_macrodistrito = s.id_macrodistrito
  LEFT JOIN municipios m ON m.id_municipio = COALESCE(s.id_municipio, md.id_municipio)
  LEFT JOIN fuentes_sismicas f ON f.id_fuente = s.id_fuente
  LEFT JOIN urban_reference_areas urban ON urban.id = 'la-paz'`;

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function toEventResponse(row: EventRow): SeismicEventResponse {
  return {
    id: row.id,
    occurredAt: new Date(row.occurredAt).toISOString(),
    magnitude: Number(row.magnitude),
    magnitudeType: row.magnitudeType,
    depthKm: Number(row.depthKm),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    location: row.locationId
      ? { id: row.locationId, name: row.locationName ?? '', type: row.locationType ?? '' }
      : null,
    epicentralDistanceKm: roundOneDecimal(Number(row.distanceKm)),
    urbanAreaDistanceKm: row.urbanAreaDistanceKm === null ? null : roundOneDecimal(Number(row.urbanAreaDistanceKm)),
    urbanAreaName: row.urbanAreaName,
    urbanAreaSource: row.urbanAreaSource,
    source: row.source,
  };
}

@Injectable()
export class EventsService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(query: QueryEventsDto): Promise<CatalogResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    if (query.startDate && query.endDate && query.startDate > query.endDate) {
      throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final.');
    }
    if (
      query.minMagnitude !== undefined &&
      query.maxMagnitude !== undefined &&
      query.minMagnitude > query.maxMagnitude
    ) {
      throw new BadRequestException('La magnitud mínima no puede superar la magnitud máxima.');
    }

    const values: (string | number)[] = [];
    const conditions: string[] = ["(m.departamento = 'La Paz' OR s.id_municipio IS NULL)"];
    const addCondition = (condition: (position: number) => string, value: string | number): void => {
      values.push(value);
      conditions.push(condition(values.length));
    };

    if (query.location) {
      addCondition(
        (position) => `(
          LOWER(md.nombre) = LOWER($${position}) OR 
          LOWER(m.nombre) = LOWER($${position}) OR 
          'macrodistrito-' || md.id_macrodistrito = $${position} OR 
          'municipio-' || m.id_municipio = $${position} OR
          md.id_macrodistrito::text = $${position} OR
          m.id_municipio::text = $${position} OR
          REPLACE(LOWER(md.nombre), ' ', '-') = LOWER($${position}) OR
          REPLACE(LOWER(m.nombre), ' ', '-') = LOWER($${position}) OR
          (LOWER($${position}) = 'zona-centro' AND LOWER(md.nombre) = 'centro')
        )`,
        query.location,
      );
    }

    if (query.startDate) {
      addCondition(
        (position) => `s.fecha_hora_utc >= ($${position}::date::timestamp AT TIME ZONE 'America/La_Paz')`,
        query.startDate,
      );
    }
    if (query.endDate) {
      addCondition(
        (position) => `s.fecha_hora_utc < (($${position}::date + 1)::timestamp AT TIME ZONE 'America/La_Paz')`,
        query.endDate,
      );
    }
    if (query.minMagnitude !== undefined) {
      addCondition((position) => `s.magnitud >= $${position}`, query.minMagnitude);
    }
    if (query.maxMagnitude !== undefined) {
      addCondition((position) => `s.magnitud <= $${position}`, query.maxMagnitude);
    }

    const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const order = ' ORDER BY s.fecha_hora_utc DESC, s.id_sismo DESC';

    const [countRows, eventRows, mapRows, recentRows] = await this.fetchCatalogQueries(
      where,
      order,
      values,
      page,
      pageSize,
    );

    const total = Number(countRows[0]?.total ?? 0);

    return {
      events: eventRows.map(toEventResponse),
      mapEvents: mapRows.map(toEventResponse),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      recentWindow: {
        hours: 48,
        count: Number(recentRows[0]?.last_48 ?? 0),
        count24Hours: Number(recentRows[0]?.last_24 ?? 0),
      },
      mapTruncated: total > 5000,
    };
  }

  async findOne(id: string): Promise<SeismicEventResponse> {
    const rows = (await this.dataSource.query(
      `${SELECT_EVENT} WHERE (s.id_sismo::text = $1 OR 'demo-' || lpad(s.id_sismo::text, 3, '0') = $1)`,
      [id],
    )) as EventRow[];
    if (rows.length === 0) {
      throw new NotFoundException('Evento sísmico no encontrado.');
    }
    return toEventResponse(rows[0]);
  }

  async create(createEventDto: CreateEventDto): Promise<SeismicEventResponse> {
    const tmRows = await this.dataSource.query(
      `SELECT id_tipo_magnitud FROM tipos_magnitud WHERE codigo = $1 LIMIT 1`,
      [createEventDto.magnitudeType],
    );
    const idTipoMagnitud = tmRows[0]?.id_tipo_magnitud ?? 1;

    let idMunicipio: number | null = null;
    let idMacrodistrito: number | null = null;
    if (createEventDto.locationId) {
      const loc = createEventDto.locationId.toLowerCase();
      const mdRows = await this.dataSource.query(
        `SELECT id_macrodistrito, id_municipio FROM macrodistritos 
         WHERE LOWER(nombre) = $1 OR 'macrodistrito-' || id_macrodistrito = $1 OR id_macrodistrito::text = $1 OR REPLACE(LOWER(nombre), ' ', '-') = $1 OR (LOWER($1) = 'zona-centro' AND LOWER(nombre) = 'centro')
         LIMIT 1`,
        [loc],
      );
      if (mdRows.length > 0) {
        idMacrodistrito = mdRows[0].id_macrodistrito;
        idMunicipio = mdRows[0].id_municipio;
      } else {
        const munRows = await this.dataSource.query(
          `SELECT id_municipio FROM municipios 
           WHERE LOWER(nombre) = $1 OR 'municipio-' || id_municipio = $1 OR id_municipio::text = $1 OR REPLACE(LOWER(nombre), ' ', '-') = $1 
           LIMIT 1`,
          [loc],
        );
        if (munRows.length > 0) {
          idMunicipio = munRows[0].id_municipio;
        }
      }
    }

    const insertResult = await this.dataSource.query(
      `INSERT INTO sismos
         (id_tipo_magnitud, id_estado_sismo, id_usuario_registro, id_municipio, id_macrodistrito, fecha_hora_utc, magnitud, profundidad_km, latitud, longitud, ubicacion_referencia)
       VALUES ($1, 3, 1, $2, $3, $4::timestamp, $5, $6, $7, $8, $9)
       RETURNING id_sismo`,
      [
        idTipoMagnitud,
        idMunicipio,
        idMacrodistrito,
        createEventDto.occurredAt,
        createEventDto.magnitude,
        createEventDto.depthKm,
        createEventDto.latitude,
        createEventDto.longitude,
        createEventDto.source?.trim() || null,
      ],
    );

    const newId = String(insertResult[0].id_sismo);
    return this.findOne(newId);
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<SeismicEventResponse> {
    await this.findOne(id);

    const assignments: string[] = [];
    const values: (string | number | null)[] = [];

    if (updateEventDto.occurredAt !== undefined) {
      values.push(updateEventDto.occurredAt);
      assignments.push(`fecha_hora_utc = $${values.length}::timestamp`);
    }
    if (updateEventDto.magnitude !== undefined) {
      values.push(updateEventDto.magnitude);
      assignments.push(`magnitud = $${values.length}`);
    }
    if (updateEventDto.depthKm !== undefined) {
      values.push(updateEventDto.depthKm);
      assignments.push(`profundidad_km = $${values.length}`);
    }
    if (updateEventDto.latitude !== undefined) {
      values.push(updateEventDto.latitude);
      assignments.push(`latitud = $${values.length}`);
    }
    if (updateEventDto.longitude !== undefined) {
      values.push(updateEventDto.longitude);
      assignments.push(`longitud = $${values.length}`);
    }
    if (updateEventDto.magnitudeType !== undefined) {
      const tmRows = await this.dataSource.query(
        `SELECT id_tipo_magnitud FROM tipos_magnitud WHERE codigo = $1 LIMIT 1`,
        [updateEventDto.magnitudeType],
      );
      if (tmRows.length > 0) {
        values.push(tmRows[0].id_tipo_magnitud);
        assignments.push(`id_tipo_magnitud = $${values.length}`);
      }
    }

    if (assignments.length > 0) {
      values.push(id);
      await this.dataSource.query(
        `UPDATE sismos SET ${assignments.join(', ')} WHERE (id_sismo::text = $${values.length} OR 'demo-' || lpad(id_sismo::text, 3, '0') = $${values.length})`,
        values,
      );
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    const rows = (await this.dataSource.query(
      `DELETE FROM sismos WHERE (id_sismo::text = $1 OR 'demo-' || lpad(id_sismo::text, 3, '0') = $1) RETURNING id_sismo`,
      [id],
    )) as { id_sismo: number }[];

    if (rows.length === 0) {
      throw new NotFoundException('Evento sísmico no encontrado.');
    }
    return { id, deleted: true };
  }

  private async fetchCatalogQueries(
    where: string,
    order: string,
    values: (string | number)[],
    page: number,
    pageSize: number,
  ): Promise<[CountRow[], EventRow[], EventRow[], RecentRow[]]> {
    const countRows = (await this.dataSource.query(
      `SELECT count(*)::int AS total FROM sismos s
       LEFT JOIN macrodistritos md ON md.id_macrodistrito = s.id_macrodistrito
       LEFT JOIN municipios m ON m.id_municipio = COALESCE(s.id_municipio, md.id_municipio)${where}`,
      values,
    )) as CountRow[];

    const eventRows = (await this.dataSource.query(
      `${SELECT_EVENT}${where}${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, pageSize, (page - 1) * pageSize],
    )) as EventRow[];

    const mapRows = (await this.dataSource.query(
      `${SELECT_EVENT}${where}${order} LIMIT 5000`,
      values,
    )) as EventRow[];

    const recentRows = (await this.dataSource.query(
      `SELECT count(*) FILTER (WHERE s.fecha_hora_utc >= now() - interval '24 hours' AND s.fecha_hora_utc <= now())::int AS last_24,
              count(*) FILTER (WHERE s.fecha_hora_utc >= now() - interval '48 hours' AND s.fecha_hora_utc <= now())::int AS last_48
       FROM sismos s
       LEFT JOIN macrodistritos md ON md.id_macrodistrito = s.id_macrodistrito
       LEFT JOIN municipios m ON m.id_municipio = COALESCE(s.id_municipio, md.id_municipio)${where}`,
      values,
    )) as RecentRow[];

    return [countRows, eventRows, mapRows, recentRows];
  }
}
