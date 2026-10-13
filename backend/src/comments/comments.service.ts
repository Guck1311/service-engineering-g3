import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Page, PaginationQueryDto, toPage} from '../common/pagination.js';
import {MusicItemsService} from '../music-items/music-items.service.js';
import {Comment} from './comment.entity.js';
import {CommentDto, CreateCommentDto} from './dto/comment.dto.js';

/** Business logic for reading and writing comments on music items. */
@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    private readonly musicItemsService: MusicItemsService,
  ) {}

  /**
   * Lists the comments on an item, newest first.
   *
   * @param musicItemId - The commented item.
   * @param query - Pagination.
   * @returns One page of comments.
   * @throws NotFoundException if the item does not exist.
   */
  async findForItem(
    musicItemId: number,
    query: PaginationQueryDto,
  ): Promise<Page<CommentDto>> {
    await this.musicItemsService.getById(musicItemId);
    const [comments, total] = await this.comments.findAndCount({
      where: {musicItemId},
      relations: {user: true},
      order: {createdAt: 'DESC', id: 'DESC'},
      skip: query.skip,
      take: query.limit,
    });
    return toPage(comments.map(CommentDto.from), total, query);
  }

  /**
   * Adds a comment to an item.
   *
   * @param musicItemId - The item to comment on.
   * @param userId - Author of the comment.
   * @param dto - The comment text.
   * @returns The created comment.
   * @throws NotFoundException if the item does not exist.
   */
  async create(
    musicItemId: number,
    userId: number,
    dto: CreateCommentDto,
  ): Promise<CommentDto> {
    await this.musicItemsService.getById(musicItemId);
    const {id} = await this.comments.save(
      this.comments.create({musicItemId, userId, text: dto.text}),
    );
    const comment = await this.comments.findOneOrFail({
      where: {id},
      relations: {user: true},
    });
    return CommentDto.from(comment);
  }
}
