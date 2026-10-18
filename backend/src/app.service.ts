import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MusicItemEntity } from './music-item.entity.js';
import type { CreateMusicItem } from './music-item.interface.js';
import { MusicItemTrackEntity } from './music-item-track.entity.js';
import { UserEntity } from './user.entity.js';
import { CollectionEntryEntity } from './collection-entry.entity.js';
import { CommentEntity } from './comment.entity.js';
import { RatingEntity } from './rating.entity.js';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(MusicItemEntity)
    private readonly musicRepository: Repository<MusicItemEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(CollectionEntryEntity)
    private readonly collectionRepository: Repository<CollectionEntryEntity>,

    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,

    @InjectRepository(RatingEntity)
    private readonly ratingRepository: Repository<RatingEntity>,
  ) {}
  // Alle Benutzer abrufen
getUsers(): Promise<UserEntity[]> {
  return this.userRepository.find();
}

// Die persönliche Sammlung eines Benutzers abrufen
async getUserCollection(userId: number): Promise<CollectionEntryEntity[]> {
  const user = await this.userRepository.findOneBy({ id: userId });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return this.collectionRepository.find({
    where: { userId },
    relations: { musicItem: true },
  });
}

// Sammlungseinträge aller Benutzer abrufen
getAllCollections(): Promise<CollectionEntryEntity[]> {
  return this.collectionRepository.find({
    relations: {
      user: true,
      musicItem: true,
    },
  });
}
  // Alle Musikobjekte aus der Datenbank lesen
  getMusicItems(): Promise<MusicItemEntity[]> {
    return this.musicRepository.find();
  }

  // Ein Musikobjekt anhand seiner ID finden
  async getMusicItemById(id: number): Promise<MusicItemEntity> {
    const item = await this.musicRepository.findOneBy({ id });

    if (!item) {
      throw new NotFoundException('Music item not found');
    }

    return item;
  }

  // Neuen Track speichern
  async addMusicItem(
    data: CreateMusicItem,
    callerHeader: string | undefined
  ): Promise<MusicItemEntity> {

    await this.checkAdmin(callerHeader);
    // Einzelne Tracks speichern
    if (data.type === 'TRACK') {
      const track = this.musicRepository.create({
        type: 'TRACK',
        title: data.title,
        artist: data.artist,
      });

      return this.musicRepository.save(track);
    }

    // Nur Alben und Playlists sind hier erlaubt
    if (data.type !== 'ALBUM' && data.type !== 'PLAYLIST') {
      throw new BadRequestException('Invalid music item type');
    }

    if (
      !Array.isArray(data.trackIds) ||
      !data.trackIds.every(id => Number.isInteger(id) && id > 0)
    ) {
      throw new BadRequestException('Invalid trackIds');
    }

    const trackIds = data.trackIds;
    const title = data.title;
    const type = data.type;
    const artist = data.type === 'ALBUM' ? data.artist : null;

    // Album/Playlist und ihre Tracks gemeinsam speichern
    return this.musicRepository.manager.transaction(async manager => {

      // Vorhandene Tracks suchen
      const tracks = trackIds.length === 0
        ? []
        : await manager.find(MusicItemEntity, {
            where: {
              id: In(trackIds),
              type: 'TRACK',
            },
          });

      // Prüfen, ob alle Track-IDs gültig sind
      const existingIds = new Set(tracks.map(track => track.id));

      if (trackIds.some(id => !existingIds.has(id))) {
        throw new BadRequestException('Some track IDs do not exist');
      }

      // Album oder Playlist erstellen
      const container = manager.create(MusicItemEntity, {
        type,
        title,
        artist,
      });

      const saved = await manager.save(container);

      // Verbindungen zu den Tracks erstellen
      const connections = trackIds.map((trackId, index) =>
        manager.create(MusicItemTrackEntity, {
          containerId: saved.id,
          trackId,
          position: index + 1,
        })
      );

      if (connections.length > 0) {
        await manager.save(connections);
      }

      return saved;
    });
  }
  async getMusicItemTracks(id: number): Promise<MusicItemEntity[]> {
    const item = await this.getMusicItemById(id);

    if (item.type === 'TRACK') {
      throw new BadRequestException('A track has no track list');
    }

    const connections = await this.musicRepository.manager.find(
      MusicItemTrackEntity,
      {
        where: { containerId: id },
        relations: { track: true },
        order: { position: 'ASC' },
      }
    );

    return connections.map(connection => connection.track);
  }
  async updateMusicItem(
    id: number,
    data: CreateMusicItem,
    callerHeader: string | undefined
  ): Promise<MusicItemEntity> {

    await this.checkAdmin(callerHeader);
    return this.musicRepository.manager.transaction(async manager => {

      // Vorhandenes Musikobjekt suchen
      const item = await manager.findOneBy(MusicItemEntity, { id });

      if (!item) {
        throw new NotFoundException('Music item not found');
      }

      // Den Musiktyp behalten wir bei
      if (item.type !== data.type) {
        throw new BadRequestException('Cannot change music item type');
      }

      // Einzelnen Track aktualisieren
      if (data.type === 'TRACK') {
        item.title = data.title;
        item.artist = data.artist;
        return manager.save(item);
      }

      // Album oder Playlist: Track-IDs prüfen
      if (
        !Array.isArray(data.trackIds) ||
        !data.trackIds.every(id => Number.isInteger(id) && id > 0)
      ) {
        throw new BadRequestException('Invalid trackIds');
      }

      const tracks = data.trackIds.length === 0
        ? []
        : await manager.find(MusicItemEntity, {
            where: { id: In(data.trackIds), type: 'TRACK' },
          });

      const existingIds = new Set(tracks.map(track => track.id));

      if (data.trackIds.some(id => !existingIds.has(id))) {
        throw new BadRequestException('Some track IDs do not exist');
      }

      // Metadaten aktualisieren
      item.title = data.title;
      item.artist = data.type === 'ALBUM' ? data.artist : null;

      await manager.save(item);

      // Alte Track-Verbindungen entfernen
      await manager.delete(MusicItemTrackEntity, {
        containerId: id,
      });

      // Neue Track-Verbindungen speichern
      const connections = data.trackIds.map((trackId, index) =>
        manager.create(MusicItemTrackEntity, {
          containerId: id,
          trackId,
          position: index + 1,
        })
      );

      if (connections.length > 0) {
        await manager.save(connections);
      }

      return item;
    });
  }

  // Musikobjekt mit seinen Tracks abrufen
  async deleteMusicItem(
    id: number,
    callerHeader: string | undefined
  ): Promise<void> {

    await this.checkAdmin(callerHeader);

    const item = await this.getMusicItemById(id);
    await this.musicRepository.remove(item);
  }

  
  
  private async checkCollectionOwner(
    userId: number,
    callerHeader: string | undefined
  ): Promise<void> {

    const callerId = Number(callerHeader);

    if (!callerHeader || !Number.isInteger(callerId)) {
      throw new UnauthorizedException('Invalid X-User-Id');
    }

    const user = await this.userRepository.findOneBy({
      id: callerId,
    });

    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }

    if (user.role !== 'USER' || user.id !== userId) {
      throw new ForbiddenException('Not your collection');
    }
  }
  async addToCollection(
    userId: number,
    musicItemId: number,
    callerHeader: string | undefined
  ): Promise<CollectionEntryEntity> {

    await this.checkCollectionOwner(userId, callerHeader);

    if (!Number.isInteger(musicItemId) || musicItemId <= 0) {
      throw new BadRequestException('Invalid music item ID');
    }

    // Prüfen, ob das Musikobjekt existiert
    await this.getMusicItemById(musicItemId);

    // Prüfen, ob es bereits in der Sammlung liegt
    const existing = await this.collectionRepository.findOneBy({
      userId,
      musicItemId,
    });

    if (existing) {
      throw new ConflictException('Already in collection');
    }

    // Sammlungseintrag erstellen
    const entry = this.collectionRepository.create({
      userId,
      musicItemId,
      reaction: 'NONE',
      favourite: false,
    });

    return this.collectionRepository.save(entry);
  }
  async removeFromCollection(
    userId: number,
    musicItemId: number,
    callerHeader: string | undefined
  ): Promise<void> {

    await this.checkCollectionOwner(userId, callerHeader);

    const entry = await this.collectionRepository.findOneBy({
      userId,
      musicItemId,
    });

    if (!entry) {
      throw new NotFoundException('Collection entry not found');
    }

    await this.collectionRepository.remove(entry);
  }

  async updateCollectionEntry(
    userId: number,
    musicItemId: number,
    data: {
      reaction?: 'NONE' | 'LIKE' | 'DISLIKE';
      favourite?: boolean;
    },
    callerHeader: string | undefined
  ): Promise<CollectionEntryEntity> {

    await this.checkCollectionOwner(userId, callerHeader);

    const entry = await this.collectionRepository.findOneBy({
      userId,
      musicItemId,
    });

    if (!entry) {
      throw new NotFoundException('Collection entry not found');
    }

    // Reaktion aktualisieren
    if (data.reaction !== undefined) {
      if (!['NONE', 'LIKE', 'DISLIKE'].includes(data.reaction)) {
        throw new BadRequestException('Invalid reaction');
      }

      entry.reaction = data.reaction;
    }

    // Favoritenstatus aktualisieren
    if (data.favourite !== undefined) {
      if (typeof data.favourite !== 'boolean') {
        throw new BadRequestException('Favourite must be boolean');
      }

      entry.favourite = data.favourite;
    }

    return this.collectionRepository.save(entry);
  }

  async getMusicItemDetails(id: number) {
    const item = await this.getMusicItemById(id);

    if (item.type === 'TRACK') {
      return item;
    }

    const tracks = await this.getMusicItemTracks(id);

    return {
      ...item,
      tracks,
    };
  }
  private async checkAdmin(
     callerHeader: string | undefined
  ): Promise<void> {

    const callerId = Number(callerHeader);

    if (
      !callerHeader ||
      !Number.isSafeInteger(callerId) ||
      callerId <= 0
    ) {
      throw new UnauthorizedException('Invalid X-User-Id');
    }

    const user = await this.userRepository.findOneBy({
      id: callerId,
    });

    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin required');
    }
  }
  async getComments(musicItemId: number): Promise<CommentEntity[]> {
    await this.getMusicItemById(musicItemId);

    return this.commentRepository.find({
      where: { musicItemId },
      relations: { user: true },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }
  async addComment(
    musicItemId: number,
    text: unknown,
    callerHeader: string | undefined
  ): Promise<CommentEntity> {

    // Benutzerkennung überprüfen
    const userId = Number(callerHeader);

    if (
      !callerHeader ||
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      throw new UnauthorizedException('Invalid X-User-Id');
    }

    const user = await this.userRepository.findOneBy({
      id: userId,
    });

    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }

    // Kommentartext überprüfen
    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new BadRequestException('Comment cannot be empty');
    }

    // Musikobjekt muss existieren
    await this.getMusicItemById(musicItemId);

    const comment = this.commentRepository.create({
      userId,
      musicItemId,
      text: text.trim(),
    });

    return this.commentRepository.save(comment);
  }
  async setRating(
    musicItemId: number,
    userId: number,
    stars: unknown,
    callerHeader: string | undefined
  ): Promise<{ rating: RatingEntity; created: boolean }> {

    // Benutzerkennung prüfen
    const callerId = Number(callerHeader);

    if (
      !callerHeader ||
      !Number.isSafeInteger(callerId) ||
      callerId <= 0
    ) {
      throw new UnauthorizedException('Invalid X-User-Id');
    }

    const user = await this.userRepository.findOneBy({
      id: callerId,
    });

    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }

    if (callerId !== userId) {
      throw new ForbiddenException('Cannot rate for another user');
    }

    // Sterne validieren
    if (
      typeof stars !== 'number' ||
      !Number.isInteger(stars) ||
      stars < 1 ||
      stars > 5
    ) {
      throw new BadRequestException('Stars must be between 1 and 5');
    }

    // Musikobjekt muss existieren
    await this.getMusicItemById(musicItemId);

    // Vorhandene Bewertung suchen
    const existing = await this.ratingRepository.findOneBy({
      userId,
      musicItemId,
    });

    if (existing) {
      existing.stars = stars;

      return {
        rating: await this.ratingRepository.save(existing),
        created: false,
      };
    }

    // Neue Bewertung erstellen
    const rating = this.ratingRepository.create({
      userId,
      musicItemId,
      stars,
    });

    return {
      rating: await this.ratingRepository.save(rating),
      created: true,
    };
  }

  async getRatings(musicItemId: number) {
    await this.getMusicItemById(musicItemId);

    const ratings = await this.ratingRepository.find({
      where: { musicItemId },
      relations: { user: true },
    });

    const count = ratings.length;

    const sum = ratings.reduce(
      (total, rating) => total + rating.stars,
      0
    );

    const average = count === 0 ? 0 : sum / count;

    return {
      average,
      count,
      ratings,
    };
  }

}
