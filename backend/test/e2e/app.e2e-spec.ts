import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('SismoPaz API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api devuelve la información del servicio', async () => {
    const response = await request(app.getHttpServer()).get('/api').expect(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.prefix).toBe('/api');
  });

  it('GET /api/health confirma la conexión con PostgreSQL', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(response.body.database).toBe('connected');
  });

  it('GET /api/events devuelve el catálogo paginado', async () => {
    const response = await request(app.getHttpServer()).get('/api/events?page=1&pageSize=5').expect(200);
    expect(Array.isArray(response.body.events)).toBe(true);
    expect(Array.isArray(response.body.mapEvents)).toBe(true);
    expect(response.body.pagination.page).toBe(1);
  });

  it('GET /api/locations devuelve las ubicaciones registradas', async () => {
    const response = await request(app.getHttpServer()).get('/api/locations').expect(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('rechaza el registro de eventos sin token', async () => {
    await request(app.getHttpServer())
      .post('/api/events')
      .send({
        occurredAt: '2026-01-01T00:00:00Z',
        magnitude: 4.2,
        magnitudeType: 'Mw',
        depthKm: 12,
        latitude: -16.5,
        longitude: -68.13,
        source: 'test',
      })
      .expect(401);
  });
});
