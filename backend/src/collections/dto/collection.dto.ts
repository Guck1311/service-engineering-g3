import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {Transform} from 'class-transformer';
import {IsBoolean, IsEnum, IsInt, IsOptional, Min} from 'class-validator';
import {PaginationQueryDto} from '../../common/pagination.js';
import {MusicItemDto} from '../../music-items/dto/music-item.dto.js';
import {UserDto} from '../../users/dto/user.dto.js';
import {Reaction} from '../collection-entry.entity.js';

/** Request body of `POST /users/{userId}/collection`. */
export class AddCollectionEntryDto {
  /** Id of the catalogue item to add. */
  @ApiProperty({example: 3, description: 'Id of a catalogue item'})
  @IsInt()
  @Min(1)
  musicItemId: number;
}

/**
 * Request body of `PATCH /users/{userId}/collection/{itemId}`.
 * Omitted fields keep their current value.
 */
export class UpdateCollectionEntryDto {
  /** New reaction. */
  @ApiPropertyOptional({
    enum: Reaction,
    enumName: 'Reaction',
    example: Reaction.LIKE,
  })
  @IsOptional()
  @IsEnum(Reaction)
  reaction?: Reaction;

  /** New favourite flag. */
  @ApiPropertyOptional({example: true})
  @IsOptional()
  @IsBoolean()
  favourite?: boolean;
}

/** Query parameters of the collection list endpoints: pagination plus filters. */
export class CollectionQueryDto extends PaginationQueryDto {
  /** Only return entries with this reaction. */
  @ApiPropertyOptional({enum: Reaction, enumName: 'Reaction'})
  @IsOptional()
  @IsEnum(Reaction)
  reaction?: Reaction;

  /** Only return favourites (`true`) or non-favourites (`false`). */
  @ApiPropertyOptional({type: Boolean})
  @IsOptional()
  // Query strings arrive as text, so convert "true"/"false" to booleans.
  @Transform(({value}) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  favourite?: boolean;
}

/** One item in a user's collection, as returned by the API. */
export class CollectionEntryDto {
  /** Owner of the collection. */
  @ApiProperty({type: UserDto})
  user: UserDto;

  /** The collected item. */
  @ApiProperty({type: MusicItemDto})
  musicItem: MusicItemDto;

  /** Like, dislike or none. */
  @ApiProperty({enum: Reaction, enumName: 'Reaction', example: Reaction.LIKE})
  reaction: Reaction;

  /** Whether the item is a favourite. */
  @ApiProperty({example: true})
  favourite: boolean;

  /** When the item was added. */
  @ApiProperty()
  addedAt: Date;
}
