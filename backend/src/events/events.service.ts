import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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
  SELECT e.id,
         e.occurred_at AS "occurredAt",
         e.magnitude,
         e.magnitude_type AS "magnitudeType",
         e.depth_km AS "depthKm",
         ST_Y(e.epicenter::geometry) AS latitude,
         ST_X(e.epicenter::geometry) AS longitude,
         l.id AS "locationId",
         l.name AS "locationName",
         l.type AS "locationType",
         e.source,
         ST_Distance(e.epicenter, ST_SetSRID(ST_MakePoint(${LA_PAZ_LONGITUDE}, ${LA_PAZ_LATITUDE}), 4326)::geography) / 1000 AS "distanceKm",
         ST_Distance(e.epicenter, urban.area) / 1000 AS "urbanAreaDistanceKm",
         urban.name AS "urbanAreaName",
         urban.source AS "urbanAreaSource"
  FROM seismic_events e
  LEFT JOIN locations l ON l.id = e.location_id
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

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23503';
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
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
    // El catálogo público se limita a La Paz. Los eventos sin ubicación
    // asignada se conservan para no ocultar registros sin clasificar.
    const conditions: string[] = ["(l.department = 'La Paz' OR e.location_id IS NULL)"];
    const addCondition = (condition: (position: number) => string, value: string | number): void => {
      values.push(value);
      conditions.push(condition(values.length));
    };

    if (query.location) {
      addCondition((position) => `e.location_id = $${position}`, query.location);
    }
    // Las fechas de calendario se interpretan en la zona de Bolivia.
    if (query.startDate) {
      addCondition(
        (position) => `e.occurred_at >= ($${position}::date::timestamp AT TIME ZONE 'America/La_Paz')`,
        query.startDate,
      );
    }
    if (query.endDate) {
      addCondition(
        (position) => `e.occurred_at < (($${position}::date + 1)::timestamp AT TIME ZONE 'America/La_Paz')`,
        query.endDate,
      );
    }
    if (query.minMagnitude !== undefined) {
      addCondition((position) => `e.magnitude >= $${position}`, query.minMagnitude);
    }
    if (query.maxMagnitude !== undefined) {
      addCondition((position) => `e.magnitude <= $${position}`, query.maxMagnitude);
    }

    const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const order = ' ORDER BY e.occurred_at DESC, e.id DESC';

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
      `${SELECT_EVENT} WHERE e.id = $1 AND (l.department = 'La Paz' OR e.location_id IS NULL)`,
      [id],
    )) as EventRow[];
    if (rows.length === 0) {
      throw new NotFoundException('Evento sísmico no encontrado.');
    }
    return toEventResponse(rows[0]);
  }

  async create(createEventDto: CreateEventDto): Promise<SeismicEventResponse> {
    const id = createEventDto.id?.trim() || `evt-${randomUUID()}`;
    await this.assertLocationExists(createEventDto.locationId ?? null);

    try {
      await this.dataSource.query(
        `INSERT INTO seismic_events
           (id, occurred_at, magnitude, magnitude_type, depth_km, epicenter, location_id, source)
         VALUES ($1, $2::timestamptz, $3, $4, $5,
                 ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography, $8, $9)`,
        [
          id,
          createEventDto.occurredAt,
          createEventDto.magnitude,
          createEventDto.magnitudeType,
          createEventDto.depthKm,
          createEventDto.longitude,
          createEventDto.latitude,
          createEventDto.locationId ?? null,
          createEventDto.source.trim(),
        ],
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Ya existe un evento sísmico con ese identificador.');
      }
      if (isForeignKeyViolation(error)) {
        throw new BadRequestException('La ubicación indicada no existe.');
      }
      throw error;
    }

    return this.findOne(id);
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<SeismicEventResponse> {
    await this.findOne(id);

    const hasLatitude = updateEventDto.latitude !== undefined;
    const hasLongitude = updateEventDto.longitude !== undefined;
    if (hasLatitude !== hasLongitude) {
      throw new BadRequestException('Debe enviar latitud y longitud juntas para actualizar el epicentro.');
    }

    const values: (string | number | null)[] = [];
    const assignments: string[] = [];
    let nextId = id;

    if (updateEventDto.id !== undefined && updateEventDto.id !== id) {
      await this.assertEventIdAvailable(updateEventDto.id);
      nextId = updateEventDto.id;
      values.push(nextId);
      assignments.push(`id = $${values.length}`);
    }
    if (updateEventDto.occurredAt !== undefined) {
      values.push(updateEventDto.occurredAt);
      assignments.push(`occurred_at = $${values.length}::timestamptz`);
    }
    if (updateEventDto.magnitude !== undefined) {
      values.push(updateEventDto.magnitude);
      assignments.push(`magnitude = $${values.length}`);
    }
    if (updateEventDto.magnitudeType !== undefined) {
      values.push(updateEventDto.magnitudeType);
      assignments.push(`magnitude_type = $${values.length}`);
    }
    if (updateEventDto.depthKm !== undefined) {
      values.push(updateEventDto.depthKm);
      assignments.push(`depth_km = $${values.length}`);
    }
    if (hasLatitude && hasLongitude) {
      values.push(updateEventDto.longitude as number);
      const longitudePosition = values.length;
      values.push(updateEventDto.latitude as number);
      const latitudePosition = values.length;
      assignments.push(
        `epicenter = ST_SetSRID(ST_MakePoint($${longitudePosition}, $${latitudePosition}), 4326)::geography`,
      );
    }
    if (updateEventDto.locationId !== undefined) {
      await this.assertLocationExists(updateEventDto.locationId);
      values.push(updateEventDto.locationId);
      assignments.push(`location_id = $${values.length}`);
    }
    if (updateEventDto.source !== undefined) {
      values.push(updateEventDto.source.trim());
      assignments.push(`source = $${values.length}`);
    }

    if (assignments.length > 0) {
      values.push(id);
      try {
        await this.dataSource.query(
          `UPDATE seismic_events SET ${assignments.join(', ')} WHERE id = $${values.length}`,
          values,
        );
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictException('Ya existe un evento sísmico con ese identificador.');
        }
        if (isForeignKeyViolation(error)) {
          throw new BadRequestException('La ubicación indicada no existe.');
        }
        throw error;
      }
    }

    return this.findOne(nextId);
  }

  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    const rows = (await this.dataSource.query('DELETE FROM seismic_events WHERE id = $1 RETURNING id', [
      id,
    ])) as { id: string }[];

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
      `SELECT count(*)::int AS total FROM seismic_events e LEFT JOIN locations l ON l.id = e.location_id${where}`,
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
      `SELECT count(*) FILTER (WHERE e.occurred_at >= now() - interval '24 hours' AND e.occurred_at <= now())::int AS last_24,
              count(*) FILTER (WHERE e.occurred_at >= now() - interval '48 hours' AND e.occurred_at <= now())::int AS last_48
       FROM seismic_events e LEFT JOIN locations l ON l.id = e.location_id${where}`,
      values,
    )) as RecentRow[];

    return [countRows, eventRows, mapRows, recentRows];
  }

  private async assertLocationExists(locationId: string | null): Promise<void> {
    if (!locationId) {
      return;
    }
    const rows = (await this.dataSource.query('SELECT id FROM locations WHERE id = $1', [
      locationId,
    ])) as { id: string }[];
    if (rows.length === 0) {
      throw new BadRequestException('La ubicación indicada no existe.');
    }
  }

  private async assertEventIdAvailable(id: string): Promise<void> {
    const rows = (await this.dataSource.query('SELECT id FROM seismic_events WHERE id = $1', [
      id,
    ])) as { id: string }[];
    if (rows.length > 0) {
      throw new ConflictException('Ya existe un evento sísmico con ese identificador.');
    }
  }
}

