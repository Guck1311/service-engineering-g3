import {Module} from '@nestjs/common';
import {APP_GUARD} from '@nestjs/core';
import {TypeOrmModule} from '@nestjs/typeorm';
import {CollectionsModule} from './collections/collections.module.js';
import {CommentsModule} from './comments/comments.module.js';
import {AuthGuard} from './common/auth.guard.js';
import {MusicItemsModule} from './music-items/music-items.module.js';
import {RatingsModule} from './ratings/ratings.module.js';
import {SeedService} from './seed/seed.service.js';
import {UsersModule} from './users/users.module.js';

/**
 * Root module of the Music Collection Manager.
 *
 * Opens the SQLite connection, imports the feature modules, registers
 * {@link AuthGuard} globally for every route and seeds demo data on startup.
 * The database file can be changed with the `DB_PATH` environment variable.
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH ?? 'music.sqlite',
      autoLoadEntities: true,
      // Creates/updates the tables from the entities on startup. Fine for this
      // exercise; a production setup would use migrations instead.
      synchronize: true,
    }),
    UsersModule,
    MusicItemsModule,
    CollectionsModule,
    CommentsModule,
    RatingsModule,
  ],
  providers: [{provide: APP_GUARD, useClass: AuthGuard}, SeedService],
})
export class AppModule {}
