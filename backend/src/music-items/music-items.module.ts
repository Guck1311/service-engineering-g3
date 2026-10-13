import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Rating} from '../ratings/rating.entity.js';
import {MusicItemTrack} from './music-item-track.entity.js';
import {MusicItem} from './music-item.entity.js';
import {MusicItemsController} from './music-items.controller.js';
import {MusicItemsService} from './music-items.service.js';

/**
 * Catalogue feature. Uses the `Rating` repository for rating summaries and
 * exports {@link MusicItemsService} for the collections, comments and ratings modules.
 */
@Module({
  imports: [TypeOrmModule.forFeature([MusicItem, MusicItemTrack, Rating])],
  controllers: [MusicItemsController],
  providers: [MusicItemsService],
  exports: [MusicItemsService],
})
export class MusicItemsModule {}
