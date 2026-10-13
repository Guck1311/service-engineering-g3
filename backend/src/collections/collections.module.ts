import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {MusicItemsModule} from '../music-items/music-items.module.js';
import {UsersModule} from '../users/users.module.js';
import {CollectionEntry} from './collection-entry.entity.js';
import {CollectionsController} from './collections.controller.js';
import {CollectionsService} from './collections.service.js';

/** Personal collections feature; depends on the users and music items modules. */
@Module({
  imports: [
    TypeOrmModule.forFeature([CollectionEntry]),
    UsersModule,
    MusicItemsModule,
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
