import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {In, Like, Repository} from 'typeorm';
import {Page, toPage} from '../common/pagination.js';
import {Rating} from '../ratings/rating.entity.js';
import {
  CreateMusicItemDto,
  UpdateMusicItemDto,
} from './dto/create-music-item.dto.js';
import {MusicItemQueryDto} from './dto/music-item-query.dto.js';
import {MusicItemDto} from './dto/music-item.dto.js';
import {MusicItem} from './music-item.entity.js';

/** Rating fields that are merged into every {@link MusicItemDto}. */
interface RatingSummary {
  averageRating: number | null;
  ratingCount: number;
}

/**
 * Business logic of the catalogue: querying, creating, replacing and deleting
 * music items, and mapping them to response DTOs.
 *
 * Exported so other modules can check that an item exists ({@link getById})
 * and build item DTOs with rating summaries ({@link toDtos}).
 */
@Injectable()
export class MusicItemsService {
  constructor(
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
      order: {id: 'ASC'},
      skip: query.skip,
      take: query.limit,
    });
    return toPage(await this.toDtos(items), total, query);
  }

  /**
   * Loads one item.
   *
   * @param id - Item id.
   * @returns The item.
   * @throws NotFoundException if the item does not exist.
   */
  async findOne(id: number): Promise<MusicItemDto> {
    const item = await this.getById(id);
    const [dto] = await this.toDtos([item]);
    return dto;
  }

  /**
   * Loads an item entity; used by other modules to check existence.
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
   * Adds an item to the catalogue.
   *
   * @param dto - The new item.
   * @returns The created item.
   */
  async create(dto: CreateMusicItemDto): Promise<MusicItemDto> {
    const item = await this.items.save(this.items.create(this.toColumns(dto)));
    return this.findOne(item.id);
  }

  /**
   * Replaces the metadata of an item.
   *
   * @param id - Item id.
   * @param dto - The complete new state of the item.
   * @returns The updated item.
   * @throws NotFoundException if the item does not exist.
   * @throws BadRequestException if the type would change.
   */
  async replace(id: number, dto: UpdateMusicItemDto): Promise<MusicItemDto> {
    const existing = await this.getById(id);
    if (existing.type !== dto.type) {
      throw new BadRequestException(
        'The type of a music item cannot be changed',
      );
    }
    await this.items.update(id, this.toColumns(dto));
    return this.findOne(id);
  }

  /**
   * Deletes an item. Collection entries, comments and ratings that reference
   * it are removed by `ON DELETE CASCADE`.
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
   * @param items - The entities to map.
   * @returns The DTOs in the same order.
   */
  async toDtos(items: MusicItem[]): Promise<MusicItemDto[]> {
    const summaries = await this.ratingSummaries(items.map(item => item.id));
    return items.map(item => this.toDto(item, summaries));
  }

  /** Maps one item together with its rating summary. */
  private toDto(
    item: MusicItem,
    summaries: Map<number, RatingSummary>,
  ): MusicItemDto {
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      artist: item.artist,
      genre: item.genre,
      releaseYear: item.releaseYear,
      durationSeconds: item.durationSeconds,
      externalUrl: item.externalUrl,
      ...(summaries.get(item.id) ?? {averageRating: null, ratingCount: 0}),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      trackCount: item.trackCount,
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

  private toColumns(dto: CreateMusicItemDto): Partial<MusicItem> {
    return {
      type: dto.type,
      title: dto.title,
      artist: dto.artist ?? null,
      genre: dto.genre ?? null,
      releaseYear: dto.releaseYear ?? null,
      durationSeconds: dto.durationSeconds ?? null,
      trackCount: dto.trackCount ?? null,
      externalUrl: dto.externalUrl ?? null,
    };
  }
}
