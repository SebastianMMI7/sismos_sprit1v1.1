import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * GET /api — comprobación rápida de que el backend está levantado.
   */
  @Get()
  index() {
    return {
      name: 'SismoPaz API',
      status: 'ok',
      prefix: '/api',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        auth: '/api/auth/login',
        users: '/api/users',
        events: '/api/events',
        locations: '/api/locations',
      },
    };
  }

  /**
   * GET /api/health — confirma la conexión real con PostgreSQL.
   */
  @Get('health')
  async health() {
    await this.dataSource.query('SELECT 1');
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
