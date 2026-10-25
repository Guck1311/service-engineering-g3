import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {MusicItemType} from '../music-item.entity.js';

/**
 * Request body of `POST /music-items`.
 *
 * The decorators validate the input; rules that need the database (e.g. that
 * `trackIds` reference existing tracks) are checked in `MusicItemsService`.
 */
export class CreateMusicItemDto {
  /** Track, album or playlist. */
  @ApiProperty({
    enum: MusicItemType,
    enumName: 'MusicItemType',
    example: MusicItemType.ALBUM,
  })
  @IsEnum(MusicItemType)
  type: MusicItemType;

  /** Title, 1 to 200 characters. */
  @ApiProperty({example: 'Abbey Road', maxLength: 200})
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  /** Performing artist. */
  @ApiPropertyOptional({example: 'The Beatles', maxLength: 200})
  @IsOptional()
  @IsString()
  @MaxLength(200)
  artist?: string;

  /** Genre. */
  @ApiPropertyOptional({example: 'Rock', maxLength: 100})
  @IsOptional()
  @IsString()
  @MaxLength(100)
  genre?: string;

  /** Four-digit year of release. */
  @ApiPropertyOptional({example: 1969})
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(9999)
  releaseYear?: number;

  /** Length in seconds; tracks only. */
  @ApiPropertyOptional({
    example: 259,
    description:
      'Tracks only; albums and playlists compute it from their tracks',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;

  /** Link to the actual music. */
  @ApiPropertyOptional({
    example: 'https://open.spotify.com/album/0ETFjACtuP2ADo6LFhL6HN',
    description: 'Reference to the actual music',
  })
  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @ApiPropertyOptional({minimum: 0})
  @IsOptional()
  @IsInt()
  @Min(0)
  trackCount?: number;
}

/** Request body of `PUT /music-items/{id}`. PUT replaces the whole item, so it takes the same fields as POST. */
export class UpdateMusicItemDto extends CreateMusicItemDto {}
