import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {MusicItemsModule} from '../music-items/music-items.module.js';
import {Comment} from './comment.entity.js';
import {CommentsController} from './comments.controller.js';
import {CommentsService} from './comments.service.js';

/** Comments feature; uses {@link MusicItemsModule} to check that items exist. */
@Module({
  imports: [TypeOrmModule.forFeature([Comment]), MusicItemsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
