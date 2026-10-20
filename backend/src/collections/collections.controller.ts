import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {ApiErrors} from '../common/api-error.dto.js';
import {assertOwner, CurrentUser, Roles} from '../common/auth.decorators.js';
import {PageDto, type Page} from '../common/pagination.js';
import {Role} from '../common/role.enum.js';
import type {User} from '../users/user.entity.js';
import {CollectionsService} from './collections.service.js';
import {
  AddCollectionEntryDto,
  CollectionEntryDto,
  CollectionQueryDto,
  UpdateCollectionEntryDto,
} from './dto/collection.dto.js';

/**
 * Endpoints of the personal collections under `/collections` and
 * `/users/{userId}/collection`. Anyone may read; only the owning user
 * (role `USER`) may change a collection.
 */
@ApiTags('collections')
@ApiErrors(401)
@Controller()
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  /**
   * `GET /collections` – collection entries of all users.
   *
   * @param query - Filters and pagination.
   * @returns One page of entries.
   */
  @Get('collections')
  @ApiOperation({summary: 'Collection entries of all users'})
  @ApiOkResponse({type: PageDto(CollectionEntryDto)})
  @ApiErrors(400)
  findAll(
    @Query() query: CollectionQueryDto,
  ): Promise<Page<CollectionEntryDto>> {
    return this.collectionsService.findAll(query);
  }

  /**
   * `GET /users/{userId}/collection` – collection of one user.
   *
   * @param userId - Owner of the collection.
   * @param query - Filters and pagination.
   * @returns One page of entries.
   */
  @Get('users/:userId/collection')
  @ApiOperation({summary: 'Collection of one user'})
  @ApiOkResponse({type: PageDto(CollectionEntryDto)})
  @ApiErrors(400, 404)
  findForUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: CollectionQueryDto,
  ): Promise<Page<CollectionEntryDto>> {
    return this.collectionsService.findAll(query, userId);
  }

  /**
   * `POST /users/{userId}/collection` – adds a catalogue item to the caller's
   * own collection.
   *
   * @param caller - The requesting user; must be the owner.
   * @param userId - Owner of the collection.
   * @param dto - The item to add.
   * @returns The new entry (201).
   */
  @Post('users/:userId/collection')
  @Roles(Role.USER)
  @ApiOperation({summary: 'Add a catalogue item to your own collection'})
  @ApiCreatedResponse({type: CollectionEntryDto})
  @ApiErrors(400, 403, 404, 409)
  add(
    @CurrentUser() caller: User,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: AddCollectionEntryDto,
  ): Promise<CollectionEntryDto> {
    assertOwner(caller, userId);
    return this.collectionsService.add(userId, dto);
  }

  /**
   * `PATCH /users/{userId}/collection/{itemId}` – marks an item in the
   * caller's collection.
   *
   * @param caller - The requesting user; must be the owner.
   * @param userId - Owner of the collection.
   * @param itemId - Id of the music item (not of the entry).
   * @param dto - `reaction` and/or `favourite`.
   * @returns The updated entry.
   */
  @Patch('users/:userId/collection/:itemId')
  @Roles(Role.USER)
  @ApiOperation({
    summary:
      'Mark an item in your collection as liked/disliked and/or favourite',
    description:
      'Both fields are optional. DISLIKE combined with favourite is rejected.',
  })
  @ApiOkResponse({type: CollectionEntryDto})
  @ApiErrors(400, 403, 404)
  update(
    @CurrentUser() caller: User,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateCollectionEntryDto,
  ): Promise<CollectionEntryDto> {
    assertOwner(caller, userId);
    return this.collectionsService.update(userId, itemId, dto);
  }

  /**
   * `DELETE /users/{userId}/collection/{itemId}` – removes an item from the
   * caller's collection. Responds with 204.
   *
   * @param caller - The requesting user; must be the owner.
   * @param userId - Owner of the collection.
   * @param itemId - Id of the music item to remove.
   */
  @Delete('users/:userId/collection/:itemId')
  @Roles(Role.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({summary: 'Remove an item from your collection'})
  @ApiNoContentResponse()
  @ApiErrors(403, 404)
  remove(
    @CurrentUser() caller: User,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<void> {
    assertOwner(caller, userId);
    return this.collectionsService.remove(userId, itemId);
  }
}
