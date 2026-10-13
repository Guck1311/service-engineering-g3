import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {MusicItemsModule} from '../music-items/music-items.module.js';
import {Rating} from './rating.entity.js';
import {RatingsController} from './ratings.controller.js';
import {RatingsService} from './ratings.service.js';

/** Ratings feature; uses {@link MusicItemsModule} to check that items exist. */
@Module({
  imports: [TypeOrmModule.forFeature([Rating]), MusicItemsModule],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
