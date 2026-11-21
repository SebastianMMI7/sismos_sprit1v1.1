import { Module } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';

/**
 * Punto único de acceso al DataSource para tareas de infraestructura
 * (comprobaciones de salud, utilidades de mantenimiento, etc.).
 */
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useExisting: getDataSourceToken(),
    },
  ],
  exports: ['DATABASE_CONNECTION'],
})
export class DatabaseModule {}

