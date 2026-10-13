import {ApiPropertyOptional} from '@nestjs/swagger';
import {IsEnum, IsOptional, IsString, MaxLength} from 'class-validator';
import {PaginationQueryDto} from '../../common/pagination.js';
import {MusicItemType} from '../music-item.entity.js';

/** Query parameters of `GET /music-items`: pagination plus filters. */
export class MusicItemQueryDto extends PaginationQueryDto {
  /** Only return items of this type. */
  @ApiPropertyOptional({enum: MusicItemType, enumName: 'MusicItemType'})
  @IsOptional()
  @IsEnum(MusicItemType)
  type?: MusicItemType;

  /** Case-insensitive text that the title or artist must contain. */
  @ApiPropertyOptional({description: 'Matches title or artist'})
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
