import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MusicItemEntity } from './music-item.entity.js';
import { MusicItemTrackEntity } from './music-item-track.entity.js';
import { UserEntity } from './user.entity.js';
import { CollectionEntryEntity } from './collection-entry.entity.js';
import { CommentEntity } from './comment.entity.js';
import { RatingEntity } from './rating.entity.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'music.sqlite',
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      MusicItemEntity,
      MusicItemTrackEntity,
      UserEntity,
      CollectionEntryEntity,
      CommentEntity,
      RatingEntity,
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
