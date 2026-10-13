import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {ApiErrors} from '../common/api-error.dto.js';
import {CurrentUser} from '../common/auth.decorators.js';
import {PageDto, PaginationQueryDto, type Page} from '../common/pagination.js';
import type {User} from '../users/user.entity.js';
import {CommentsService} from './comments.service.js';
import {CommentDto, CreateCommentDto} from './dto/comment.dto.js';

/** Endpoints for comments under `/music-items/{id}/comments`, open to every user. */
@ApiTags('comments')
@ApiErrors(401)
@Controller('music-items/:id/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * `GET /music-items/{id}/comments` – comments on an item, newest first.
   *
   * @param id - Item id from the path.
   * @param query - Pagination.
   * @returns One page of comments.
   */
  @Get()
  @ApiOperation({summary: 'Comments on a music item, newest first'})
  @ApiOkResponse({type: PageDto(CommentDto)})
  @ApiErrors(400, 404)
  findAll(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ): Promise<Page<CommentDto>> {
    return this.commentsService.findForItem(id, query);
  }

  /**
   * `POST /music-items/{id}/comments` – comments on an item as the caller.
   *
   * @param caller - The requesting user, who becomes the author.
   * @param id - Item id from the path.
   * @param dto - The comment text.
   * @returns The created comment (201).
   */
  @Post()
  @ApiOperation({summary: 'Comment on a music item as the current user'})
  @ApiCreatedResponse({type: CommentDto})
  @ApiErrors(400, 404)
  create(
    @CurrentUser() caller: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentDto> {
    return this.commentsService.create(id, caller.id, dto);
  }
}
