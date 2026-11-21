import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module';
import { LocationsModule } from './locations/locations.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Lectura del archivo .env (mismos nombres de variables en todos los proyectos).
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // Conexión PostgreSQL. El esquema se versiona en db/schema.sql y
    // db/migrations/; synchronize queda desactivado por defecto para no borrar
    // índices ni restricciones creadas por las migraciones. Para desarrollo
    // efímero se puede activar con DB_SYNCHRONIZE=true.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', 'sismos'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        installExtensions: true,
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
        ssl: config.get<string>('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),

    CommonModule,
    AuthModule,
    UsersModule,
    LocationsModule,
    EventsModule,
    DatabaseModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
