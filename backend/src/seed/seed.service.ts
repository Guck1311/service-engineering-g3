import {Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common';
import {InjectDataSource} from '@nestjs/typeorm';
import {DataSource} from 'typeorm';
import {
  CollectionEntry,
  Reaction,
} from '../collections/collection-entry.entity.js';
import {Comment} from '../comments/comment.entity.js';
import {Role} from '../common/role.enum.js';
import {MusicItem, MusicItemType} from '../music-items/music-item.entity.js';
import {Rating} from '../ratings/rating.entity.js';
import {User} from '../users/user.entity.js';

/**
 * Fills an empty database with demo data. Users are needed because there is
 * no registration in exercise 1.
 *
 * Seeded users: `1` = Admin (ADMIN), `2` = Anna (USER), `3` = Ben (USER),
 * plus five tracks, the album "Abbey Road", the playlist "Road Trip" and
 * sample collection entries, comments and ratings.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Runs once the application has started. Does nothing if users already
   * exist; otherwise inserts all demo data in one transaction.
   */
  async onApplicationBootstrap(): Promise<void> {
    if ((await this.dataSource.getRepository(User).count()) > 0) {
      return;
    }
    await this.dataSource.transaction(async m => {
      const [admin, anna, ben] = await m.save(User, [
        {name: 'Admin', role: Role.ADMIN},
        {name: 'Anna', role: Role.USER},
        {name: 'Ben', role: Role.USER},
      ]);

      const track = (
        title: string,
        artist: string,
        durationSeconds: number,
        releaseYear: number,
        genre: string,
      ) =>
        m.create(MusicItem, {
          type: MusicItemType.TRACK,
          title,
          artist,
          durationSeconds,
          releaseYear,
          genre,
        });
      const [comeTogether, something, hereComesTheSun, getLucky, bohemian] =
        await m.save(MusicItem, [
          track('Come Together', 'The Beatles', 259, 1969, 'Rock'),
          track('Something', 'The Beatles', 182, 1969, 'Rock'),
          track('Here Comes the Sun', 'The Beatles', 185, 1969, 'Rock'),
          track('Get Lucky', 'Daft Punk', 369, 2013, 'Electronic'),
          track('Bohemian Rhapsody', 'Queen', 354, 1975, 'Rock'),
        ]);

      const [abbeyRoad, roadTrip] = await m.save(MusicItem, [
        m.create(MusicItem, {
          type: MusicItemType.ALBUM,
          title: 'Abbey Road',
          artist: 'The Beatles',
          genre: 'Rock',
          releaseYear: 1969,
          externalUrl: 'https://open.spotify.com/album/0ETFjACtuP2ADo6LFhL6HN',
        }),
        m.create(MusicItem, {
          type: MusicItemType.PLAYLIST,
          title: 'Road Trip',
        }),
      ]);
      const trackList = (container: MusicItem, tracks: MusicItem[]) =>
        tracks.map((t, i) => ({
          containerId: container.id,
          trackId: t.id,
          position: i + 1,
        }));

      await m.insert(CollectionEntry, [
        {
          userId: anna.id,
          musicItemId: abbeyRoad.id,
          reaction: Reaction.LIKE,
          favourite: true,
        },
        {userId: anna.id, musicItemId: getLucky.id},
        {
          userId: ben.id,
          musicItemId: roadTrip.id,
          reaction: Reaction.DISLIKE,
        },
        {
          userId: ben.id,
          musicItemId: bohemian.id,
          reaction: Reaction.LIKE,
          favourite: true,
        },
      ]);
      await m.insert(Comment, [
        {
          userId: anna.id,
          musicItemId: abbeyRoad.id,
          text: 'Side B is a masterpiece.',
        },
        {
          userId: ben.id,
          musicItemId: bohemian.id,
          text: 'Still gives me chills.',
        },
        {
          userId: admin.id,
          musicItemId: roadTrip.id,
          text: 'Curated for long drives.',
        },
      ]);
      await m.insert(Rating, [
        {userId: anna.id, musicItemId: abbeyRoad.id, stars: 5},
        {userId: ben.id, musicItemId: abbeyRoad.id, stars: 4},
        {userId: ben.id, musicItemId: bohemian.id, stars: 5},
        {userId: ben.id, musicItemId: roadTrip.id, stars: 2},
      ]);
    });
    this.logger.log('Seeded demo data (users: 1 = Admin, 2 = Anna, 3 = Ben)');
  }
}
