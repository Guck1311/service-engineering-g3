import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {InjectDataSource, InjectRepository} from '@nestjs/typeorm';
import {DataSource, EntityManager, In, Like, Repository} from 'typeorm';
import {Page, toPage} from '../common/pagination.js';
import {Rating} from '../ratings/rating.entity.js';
import {
  CreateMusicItemDto,
  UpdateMusicItemDto,
} from './dto/create-music-item.dto.js';
import {MusicItemQueryDto} from './dto/music-item-query.dto.js';
import {MusicItemDetailDto, MusicItemDto} from './dto/music-item.dto.js';
import {MusicItemTrack} from './music-item-track.entity.js';
import {MusicItem, MusicItemType} from './music-item.entity.js';

/** Rating fields that are merged into every {@link MusicItemDto}. */
interface RatingSummary {
  averageRating: number | null;
  ratingCount: number;
}

/**
 * Business logic of the catalogue: querying, creating, replacing and deleting
 * music items and their track lists, and mapping them to response DTOs.
 *
 * Exported so other modules can check that an item exists ({@link getById})
 * and build item DTOs with rating summaries ({@link toDtos}).
 */
@Injectable()
export class MusicItemsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(MusicItem) private readonly items: Repository<MusicItem>,
    @InjectRepository(Rating) private readonly ratings: Repository<Rating>,
  ) {}

  /**
   * Lists catalogue items, optionally filtered by type and by a search text
   * that the title or artist must contain.
   *
   * @param query - Filters and pagination.
   * @returns One page of items, ordered by id.
   */
  async findAll(query: MusicItemQueryDto): Promise<Page<MusicItemDto>> {
    const base = query.type ? {type: query.type} : {};
    const where = query.search
      ? [
          {...base, title: Like(`%${query.search}%`)},
          {...base, artist: Like(`%${query.search}%`)},
        ]
      : base;

    const [items, total] = await this.items.findAndCount({
      where,
      relations: {tracks: {track: true}},
      order: {id: 'ASC', tracks: {position: 'ASC'}},
      skip: query.skip,
      take: query.limit,
    });
    return toPage(await this.toDtos(items), total, query);
  }

  /**
   * Loads one item with its ordered track list.
   *
   * @param id - Item id.
   * @returns The item including its tracks.
   * @throws NotFoundException if the item does not exist.
   */
  async findOne(id: number): Promise<MusicItemDetailDto> {
    const item = await this.items.findOne({
      where: {id},
      relations: {tracks: {track: true}},
      order: {tracks: {position: 'ASC'}},
    });
    if (!item) {
      throw new NotFoundException(`Music item ${id} not found`);
    }
    return this.toDetailDto(item);
  }

  /**
   * Loads an item without relations; used by other modules to check existence.
   *
   * @param id - Item id.
   * @returns The item entity.
   * @throws NotFoundException if the item does not exist.
   */
  async getById(id: number): Promise<MusicItem> {
    const item = await this.items.findOneBy({id});
    if (!item) {
      throw new NotFoundException(`Music item ${id} not found`);
    }
    return item;
  }

  /**
   * Adds an item to the catalogue. The item and its track list are written
   * in one transaction.
   *
   * @param dto - The new item.
   * @returns The created item including its tracks.
   * @throws BadRequestException if the item breaks a rule of {@link validate}.
   */
  async create(dto: CreateMusicItemDto): Promise<MusicItemDetailDto> {
    await this.validate(dto);
    const id = await this.dataSource.transaction(async manager => {
      const item = await manager.save(
        manager.create(MusicItem, this.toColumns(dto)),
      );
      await this.replaceTracks(manager, item.id, dto.trackIds ?? []);
      return item.id;
    });
    return this.findOne(id);
  }

  /**
   * Replaces the metadata and the track list of an item in one transaction.
   *
   * @param id - Item id.
   * @param dto - The complete new state of the item.
   * @returns The updated item including its tracks.
   * @throws NotFoundException if the item does not exist.
   * @throws BadRequestException if the type would change or a rule of {@link validate} is broken.
   */
  async replace(
    id: number,
    dto: UpdateMusicItemDto,
  ): Promise<MusicItemDetailDto> {
    const existing = await this.getById(id);
    if (existing.type !== dto.type) {
      throw new BadRequestException(
        'The type of a music item cannot be changed',
      );
    }
    await this.validate(dto, id);
    await this.dataSource.transaction(async manager => {
      await manager.update(MusicItem, id, this.toColumns(dto));
      await this.replaceTracks(manager, id, dto.trackIds ?? []);
    });
    return this.findOne(id);
  }

  /**
   * Deletes an item. Collection entries, track list positions, comments and
   * ratings that reference it are removed by `ON DELETE CASCADE`.
   *
   * @param id - Item id.
   * @throws NotFoundException if the item does not exist.
   */
  async remove(id: number): Promise<void> {
    await this.getById(id);
    await this.items.delete(id);
  }

  /**
   * Maps entities to response DTOs, including their rating summaries,
   * which are loaded with one query for all items.
   *
   * @param items - Entities with the `tracks.track` relation loaded.
   * @returns The DTOs in the same order.
   */
  async toDtos(items: MusicItem[]): Promise<MusicItemDto[]> {
    const summaries = await this.ratingSummaries(items.map(item => item.id));
    return items.map(item => this.toDto(item, summaries));
  }

  /** Maps an item and its tracks, each with its own rating summary. */
  private async toDetailDto(item: MusicItem): Promise<MusicItemDetailDto> {
    const tracks = item.tracks.map(entry => entry.track);
    const summaries = await this.ratingSummaries([
      item.id,
      ...tracks.map(t => t.id),
    ]);
    return {
      ...this.toDto(item, summaries),
      tracks: item.tracks.map(entry => ({
        position: entry.position,
        track: this.toDto({...entry.track, tracks: []}, summaries),
      })),
    };
  }

  /**
   * Maps one item; for albums and playlists the duration is the sum of the
   * track durations.
   */
  private toDto(
    item: MusicItem,
    summaries: Map<number, RatingSummary>,
  ): MusicItemDto {
    const tracks = item.tracks ?? [];
    const durationSeconds =
      item.type === MusicItemType.TRACK
        ? item.durationSeconds
        : tracks.reduce(
            (sum, entry) => sum + (entry.track.durationSeconds ?? 0),
            0,
          );

    return {
      id: item.id,
      type: item.type,
      title: item.title,
      artist: item.artist,
      genre: item.genre,
      releaseYear: item.releaseYear,
      durationSeconds,
      externalUrl: item.externalUrl,
      trackCount: tracks.length,
      ...(summaries.get(item.id) ?? {averageRating: null, ratingCount: 0}),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * Calculates average and count of the ratings of several items in one
   * grouped query. Items without ratings are missing from the map.
   *
   * @param ids - Item ids.
   * @returns Rating summary per item id.
   */
  private async ratingSummaries(
    ids: number[],
  ): Promise<Map<number, RatingSummary>> {
    if (ids.length === 0) {
      return new Map();
    }
    const rows: {musicItemId: number; average: number; count: number}[] =
      await this.ratings
        .createQueryBuilder('rating')
        .select('rating.musicItemId', 'musicItemId')
        .addSelect('AVG(rating.stars)', 'average')
        .addSelect('COUNT(*)', 'count')
        .where({musicItemId: In(ids)})
        .groupBy('rating.musicItemId')
        .getRawMany();

    return new Map(
      rows.map(row => [
        row.musicItemId,
        {
          averageRating: Math.round(row.average * 10) / 10,
          ratingCount: Number(row.count),
        },
      ]),
    );
  }

  /**
   * Checks the rules that depend on the item type and on other items:
   * - a track has no track list;
   * - albums and playlists don't set `durationSeconds` (it is computed);
   * - an item cannot contain itself;
   * - all `trackIds` reference existing items of type `TRACK`.
   *
   * @param dto - The item to check.
   * @param ownId - Id of the item being replaced, if any.
   * @throws BadRequestException if a rule is broken.
   */
  private async validate(
    dto: CreateMusicItemDto,
    ownId?: number,
  ): Promise<void> {
    const trackIds = dto.trackIds ?? [];

    if (dto.type === MusicItemType.TRACK) {
      if (trackIds.length > 0) {
        throw new BadRequestException('A track cannot contain other tracks');
      }
      return;
    }
    if (dto.durationSeconds !== undefined) {
      throw new BadRequestException(
        'durationSeconds is computed from the tracks of an album or playlist',
      );
    }
    if (ownId !== undefined && trackIds.includes(ownId)) {
      throw new BadRequestException('A music item cannot contain itself');
    }

    const uniqueIds = [...new Set(trackIds)];
    const tracks = await this.items.findBy({
      id: In(uniqueIds),
      type: MusicItemType.TRACK,
    });
    const found = new Set(tracks.map(track => track.id));
    const invalid = uniqueIds.filter(id => !found.has(id));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `These ids are not existing tracks: ${invalid.join(', ')}`,
      );
    }
  }

  /** Maps a request DTO to entity columns; omitted optional fields become `null`. */
  private toColumns(dto: CreateMusicItemDto): Partial<MusicItem> {
    return {
      type: dto.type,
      title: dto.title,
      artist: dto.artist ?? null,
      genre: dto.genre ?? null,
      releaseYear: dto.releaseYear ?? null,
      durationSeconds: dto.durationSeconds ?? null,
      externalUrl: dto.externalUrl ?? null,
    };
  }

  /**
   * Replaces the track list of an album or playlist; positions start at 1.
   *
   * @param manager - Entity manager of the surrounding transaction.
   * @param containerId - Id of the album or playlist.
   * @param trackIds - Ordered track ids.
   */
  private async replaceTracks(
    manager: EntityManager,
    containerId: number,
    trackIds: number[],
  ) {
    await manager.delete(MusicItemTrack, {containerId});
    if (trackIds.length > 0) {
      await manager.insert(
        MusicItemTrack,
        trackIds.map((trackId, index) => ({
          containerId,
          trackId,
          position: index + 1,
        })),
      );
    }
  }
}
