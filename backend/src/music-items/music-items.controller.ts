import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import {Roles} from '../common/auth.decorators.js';
import {PageDto, type Page} from '../common/pagination.js';
import {Role} from '../common/role.enum.js';
import {
  CreateMusicItemDto,
  UpdateMusicItemDto,
} from './dto/create-music-item.dto.js';
import {MusicItemQueryDto} from './dto/music-item-query.dto.js';
import {MusicItemDetailDto, MusicItemDto} from './dto/music-item.dto.js';
import {MusicItemsService} from './music-items.service.js';

/**
 * Endpoints of the shared catalogue under `/music-items`.
 * Reading is open to every user; changes require the `ADMIN` role.
 */
@ApiTags('music-items')
@ApiErrors(401)
@Controller('music-items')
export class MusicItemsController {
  constructor(private readonly musicItemsService: MusicItemsService) {}

  /**
   * `GET /music-items` – lists the catalogue.
   *
   * @param query - Filters `type` and `search`, pagination `page` and `limit`.
   * @returns One page of items.
   */
  @Get()
  @ApiOperation({
    summary: 'List the catalogue, optionally filtered by type or search text',
  })
  @ApiOkResponse({type: PageDto(MusicItemDto)})
  @ApiErrors(400)
  findAll(@Query() query: MusicItemQueryDto): Promise<Page<MusicItemDto>> {
    return this.musicItemsService.findAll(query);
  }

  /**
   * `GET /music-items/{id}` – returns one item with its track list.
   *
   * @param id - Item id from the path.
   * @returns The item including its tracks.
   */
  @Get(':id')
  @ApiOperation({summary: 'Get a music item including its track list'})
  @ApiOkResponse({type: MusicItemDetailDto})
  @ApiErrors(404)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<MusicItemDetailDto> {
    return this.musicItemsService.findOne(id);
  }

  /**
   * `POST /music-items` – adds an item to the catalogue (admin only).
   *
   * @param dto - The new item.
   * @returns The created item (201).
   */
  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Add a track, album or playlist to the catalogue (admin)',
  })
  @ApiCreatedResponse({type: MusicItemDetailDto})
  @ApiErrors(400, 403)
  create(@Body() dto: CreateMusicItemDto): Promise<MusicItemDetailDto> {
    return this.musicItemsService.create(dto);
  }

  /**
   * `PUT /music-items/{id}` – replaces an item and its track list (admin only).
   *
   * @param id - Item id from the path.
   * @param dto - The complete new state of the item.
   * @returns The updated item.
   */
  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({summary: 'Replace a music item and its track list (admin)'})
  @ApiOkResponse({type: MusicItemDetailDto})
  @ApiErrors(400, 403, 404)
  replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMusicItemDto,
  ): Promise<MusicItemDetailDto> {
    return this.musicItemsService.replace(id, dto);
  }

  /**
   * `DELETE /music-items/{id}` – removes an item from the catalogue and from
   * all collections (admin only). Responds with 204.
   *
   * @param id - Item id from the path.
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Remove a music item from the catalogue and all collections (admin)',
  })
  @ApiNoContentResponse()
  @ApiErrors(403, 404)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.musicItemsService.remove(id);
  }
}
