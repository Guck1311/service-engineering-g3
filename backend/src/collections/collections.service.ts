import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {FindOptionsWhere, Repository} from 'typeorm';
import {Page, toPage} from '../common/pagination.js';
import {MusicItemsService} from '../music-items/music-items.service.js';
import {UserDto} from '../users/dto/user.dto.js';
import {UsersService} from '../users/users.service.js';
import {CollectionEntry, Reaction} from './collection-entry.entity.js';
import {
  AddCollectionEntryDto,
  CollectionEntryDto,
  CollectionQueryDto,
  UpdateCollectionEntryDto,
} from './dto/collection.dto.js';

/**
 * Business logic of the personal collections: listing, adding, marking and
 * removing entries. Ownership is checked by the controller.
 */
@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(CollectionEntry)
    private readonly entries: Repository<CollectionEntry>,
    private readonly usersService: UsersService,
    private readonly musicItemsService: MusicItemsService,
  ) {}

  /**
   * Lists the collection entries of all users, or of one user when `userId`
   * is given.
   *
   * @param query - Filters `reaction` and `favourite`, and pagination.
   * @param userId - Only list this user's entries.
   * @returns One page of entries, grouped by user, newest first.
   * @throws NotFoundException if `userId` is given but the user does not exist.
   */
  async findAll(
    query: CollectionQueryDto,
    userId?: number,
  ): Promise<Page<CollectionEntryDto>> {
    if (userId !== undefined) {
      await this.usersService.getById(userId);
    }
    // TypeORM rejects undefined values in `where`, so only set the filters that were given.
    const where: FindOptionsWhere<CollectionEntry> = {};
    if (userId !== undefined) where.userId = userId;
    if (query.reaction !== undefined) where.reaction = query.reaction;
    if (query.favourite !== undefined) where.favourite = query.favourite;

    const [entries, total] = await this.entries.findAndCount({
      where,
      relations: {user: true, musicItem: {tracks: {track: true}}},
      order: {userId: 'ASC', addedAt: 'DESC', id: 'DESC'},
      skip: query.skip,
      take: query.limit,
    });
    return toPage(await this.toDtos(entries), total, query);
  }

  /**
   * Adds a catalogue item to a user's collection, unmarked.
   *
   * @param userId - Owner of the collection.
   * @param dto - The item to add.
   * @returns The new entry.
   * @throws NotFoundException if the item does not exist.
   * @throws ConflictException if the item is already in the collection.
   */
  async add(
    userId: number,
    dto: AddCollectionEntryDto,
  ): Promise<CollectionEntryDto> {
    await this.musicItemsService.getById(dto.musicItemId);
    const exists = await this.entries.existsBy({
      userId,
      musicItemId: dto.musicItemId,
    });
    if (exists) {
      throw new ConflictException(
        `Music item ${dto.musicItemId} is already in the collection`,
      );
    }
    await this.entries.insert({userId, musicItemId: dto.musicItemId});
    return this.findOne(userId, dto.musicItemId);
  }

  /**
   * Changes the reaction and/or favourite flag of an entry. The new values
   * are merged with the current ones before the DISLIKE + favourite rule is checked.
   *
   * @param userId - Owner of the collection.
   * @param musicItemId - The collected item.
   * @param dto - Fields to change.
   * @returns The updated entry.
   * @throws NotFoundException if the item is not in the collection.
   * @throws BadRequestException if the entry would be disliked and a favourite.
   */
  async update(
    userId: number,
    musicItemId: number,
    dto: UpdateCollectionEntryDto,
  ): Promise<CollectionEntryDto> {
    const entry = await this.getEntry(userId, musicItemId);
    const reaction = dto.reaction ?? entry.reaction;
    const favourite = dto.favourite ?? entry.favourite;

    if (reaction === Reaction.DISLIKE && favourite) {
      throw new BadRequestException('A disliked item cannot be a favourite');
    }
    await this.entries.update(entry.id, {reaction, favourite});
    return this.findOne(userId, musicItemId);
  }

  /**
   * Removes an item from a user's collection; the catalogue is not changed.
   *
   * @param userId - Owner of the collection.
   * @param musicItemId - The item to remove.
   * @throws NotFoundException if the item is not in the collection.
   */
  async remove(userId: number, musicItemId: number): Promise<void> {
    const entry = await this.getEntry(userId, musicItemId);
    await this.entries.delete(entry.id);
  }

  /** Loads an entry that is known to exist, with everything its DTO needs. */
  private async findOne(
    userId: number,
    musicItemId: number,
  ): Promise<CollectionEntryDto> {
    const entry = await this.entries.findOneOrFail({
      where: {userId, musicItemId},
      relations: {user: true, musicItem: {tracks: {track: true}}},
    });
    const [dto] = await this.toDtos([entry]);
    return dto;
  }

  /**
   * Loads an entry without relations.
   *
   * @throws NotFoundException if the item is not in the user's collection.
   */
  private async getEntry(
    userId: number,
    musicItemId: number,
  ): Promise<CollectionEntry> {
    const entry = await this.entries.findOneBy({userId, musicItemId});
    if (!entry) {
      throw new NotFoundException(
        `Music item ${musicItemId} is not in the collection of user ${userId}`,
      );
    }
    return entry;
  }

  /** Maps entries to DTOs; item DTOs and their ratings come from {@link MusicItemsService}. */
  private async toDtos(
    entries: CollectionEntry[],
  ): Promise<CollectionEntryDto[]> {
    const items = await this.musicItemsService.toDtos(
      entries.map(entry => entry.musicItem),
    );
    return entries.map((entry, index) => ({
      user: UserDto.from(entry.user),
      musicItem: items[index],
      reaction: entry.reaction,
      favourite: entry.favourite,
      addedAt: entry.addedAt,
    }));
  }
}
