import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  Res,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {Response} from 'express';
import {ApiErrors} from '../common/api-error.dto.js';
import {assertOwner, CurrentUser} from '../common/auth.decorators.js';
import type {User} from '../users/user.entity.js';
import {RateDto, RatingDto, RatingSummaryDto} from './dto/rating.dto.js';
import {RatingsService} from './ratings.service.js';

/**
 * Endpoints for ratings under `/music-items/{id}/ratings`. Anyone may read;
 * each user may only set their own rating.
 */
@ApiTags('ratings')
@ApiErrors(401)
@Controller('music-items/:id/ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  /**
   * `GET /music-items/{id}/ratings` – average, count and all ratings of an item.
   *
   * @param id - Item id from the path.
   * @returns The rating summary.
   */
  @Get()
  @ApiOperation({summary: 'Average and individual ratings of a music item'})
  @ApiOkResponse({type: RatingSummaryDto})
  @ApiErrors(404)
  findAll(@Param('id', ParseIntPipe) id: number): Promise<RatingSummaryDto> {
    return this.ratingsService.findForItem(id);
  }

  /**
   * `PUT /music-items/{id}/ratings/{userId}` – sets the caller's own rating.
   * Responds with 201 for the first rating and 200 when it replaces one.
   *
   * @param caller - The requesting user; must match `userId`.
   * @param id - Item id from the path.
   * @param userId - The user whose rating is set.
   * @param dto - Number of stars.
   * @param res - Express response, used only to set the status code.
   * @returns The rating.
   */
  @Put(':userId')
  @ApiOperation({
    summary: 'Set your own 1-5 star rating (creates or replaces it)',
  })
  @ApiOkResponse({type: RatingDto, description: 'Existing rating replaced'})
  @ApiCreatedResponse({
    type: RatingDto,
    description: 'First rating by this user',
  })
  @ApiErrors(400, 403, 404)
  async rate(
    @CurrentUser() caller: User,
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: RateDto,
    @Res({passthrough: true}) res: Response,
  ): Promise<RatingDto> {
    assertOwner(caller, userId);
    const {rating, created} = await this.ratingsService.rate(id, userId, dto);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return rating;
  }
}
