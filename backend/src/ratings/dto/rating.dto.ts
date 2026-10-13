import {ApiProperty} from '@nestjs/swagger';
import {IsInt, Max, Min} from 'class-validator';
import {UserDto} from '../../users/dto/user.dto.js';

/** Request body of `PUT /music-items/{id}/ratings/{userId}`. */
export class RateDto {
  /** Number of stars, an integer from 1 to 5. */
  @ApiProperty({minimum: 1, maximum: 5, example: 4})
  @IsInt()
  @Min(1)
  @Max(5)
  stars: number;
}

/** One user's rating as returned by the API. */
export class RatingDto {
  /** The rated item. */
  @ApiProperty({example: 3})
  musicItemId: number;

  /** The user who rated. */
  @ApiProperty({type: UserDto})
  user: UserDto;

  /** Number of stars. */
  @ApiProperty({minimum: 1, maximum: 5, example: 4})
  stars: number;

  /** When the rating was last set. */
  @ApiProperty()
  updatedAt: Date;
}

/** Response of `GET /music-items/{id}/ratings`: summary plus all ratings. */
export class RatingSummaryDto {
  /** Average stars rounded to one decimal, or `null` if not rated yet. */
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 4.5,
    description: 'null if not rated yet',
  })
  average: number | null;

  /** Number of ratings. */
  @ApiProperty({example: 2})
  count: number;

  /** All ratings, most recently set first. */
  @ApiProperty({type: [RatingDto]})
  ratings: RatingDto[];
}
