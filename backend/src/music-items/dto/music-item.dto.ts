import {ApiProperty} from '@nestjs/swagger';
import {MusicItemType} from '../music-item.entity.js';

/**
 * A music item as returned by the API, with computed fields
 * (`durationSeconds` of albums/playlists, `trackCount`, rating summary).
 */
export class MusicItemDto {
  /** Item id. */
  @ApiProperty({example: 3})
  id: number;

  /** Track, album or playlist. */
  @ApiProperty({
    enum: MusicItemType,
    enumName: 'MusicItemType',
    example: MusicItemType.ALBUM,
  })
  type: MusicItemType;

  /** Title. */
  @ApiProperty({example: 'Abbey Road'})
  title: string;

  /** Performing artist, or `null`. */
  @ApiProperty({type: String, nullable: true, example: 'The Beatles'})
  artist: string | null;

  /** Genre, or `null`. */
  @ApiProperty({type: String, nullable: true, example: 'Rock'})
  genre: string | null;

  /** Year of release, or `null`. */
  @ApiProperty({type: Number, nullable: true, example: 1969})
  releaseYear: number | null;

  /** Length in seconds; for albums and playlists the sum of their tracks. */
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 444,
    description: 'For albums and playlists: sum of the track durations',
  })
  durationSeconds: number | null;

  /** Link to the actual music, or `null`. */
  @ApiProperty({
    type: String,
    nullable: true,
    example: 'https://open.spotify.com/album/0ETFjACtuP2ADo6LFhL6HN',
  })
  externalUrl: string | null;

  /** Average stars rounded to one decimal, or `null` if not rated yet. */
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 4.5,
    description: 'null if not rated yet',
  })
  averageRating: number | null;

  /** Number of ratings. */
  @ApiProperty({example: 2})
  ratingCount: number;

  /** Creation time. */
  @ApiProperty()
  createdAt: Date;

  /** Time of the last update. */
  @ApiProperty()
  updatedAt: Date;

  /** Number of tracks of an album or playlist, or `null`. */
  @ApiProperty({type: Number, nullable: true, example: 17})
  trackCount: number | null;
}
