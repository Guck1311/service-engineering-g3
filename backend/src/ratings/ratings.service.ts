import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {MusicItemsService} from '../music-items/music-items.service.js';
import {UserDto} from '../users/dto/user.dto.js';
import {RateDto, RatingDto, RatingSummaryDto} from './dto/rating.dto.js';
import {Rating} from './rating.entity.js';

/** Business logic for reading and setting 1-5 star ratings. */
@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating) private readonly ratings: Repository<Rating>,
    private readonly musicItemsService: MusicItemsService,
  ) {}

  /**
   * Returns the average, the count and all ratings of an item.
   *
   * @param musicItemId - The rated item.
   * @returns The rating summary, most recent ratings first.
   * @throws NotFoundException if the item does not exist.
   */
  async findForItem(musicItemId: number): Promise<RatingSummaryDto> {
    await this.musicItemsService.getById(musicItemId);
    const ratings = await this.ratings.find({
      where: {musicItemId},
      relations: {user: true},
      order: {updatedAt: 'DESC'},
    });
    const sum = ratings.reduce((total, rating) => total + rating.stars, 0);
    return {
      average: ratings.length
        ? Math.round((sum / ratings.length) * 10) / 10
        : null,
      count: ratings.length,
      ratings: ratings.map(toDto),
    };
  }

  /**
   * Creates or replaces a user's rating of an item.
   *
   * @param musicItemId - The item to rate.
   * @param userId - The user who rates.
   * @param dto - Number of stars.
   * @returns The rating, and `created: true` if it is the user's first
   *   rating of this item (the controller then sends 201 instead of 200).
   * @throws NotFoundException if the item does not exist.
   */
  async rate(
    musicItemId: number,
    userId: number,
    dto: RateDto,
  ): Promise<{rating: RatingDto; created: boolean}> {
    await this.musicItemsService.getById(musicItemId);
    const created = !(await this.ratings.existsBy({musicItemId, userId}));
    await this.ratings.save({musicItemId, userId, stars: dto.stars});

    const rating = await this.ratings.findOneOrFail({
      where: {musicItemId, userId},
      relations: {user: true},
    });
    return {rating: toDto(rating), created};
  }
}

/**
 * Maps a rating entity to its DTO.
 *
 * @param rating - The entity, with the `user` relation loaded.
 */
function toDto(rating: Rating): RatingDto {
  return {
    musicItemId: rating.musicItemId,
    user: UserDto.from(rating.user),
    stars: rating.stars,
    updatedAt: rating.updatedAt,
  };
}
