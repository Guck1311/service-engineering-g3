import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString, MaxLength} from 'class-validator';
import {UserDto} from '../../users/dto/user.dto.js';
import type {Comment} from '../comment.entity.js';

/** Request body of `POST /music-items/{id}/comments`. */
export class CreateCommentDto {
  /** Comment text, 1 to 2000 characters. */
  @ApiProperty({example: 'Side B is a masterpiece.', maxLength: 2000})
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;
}

/** A comment as returned by the API, including its author. */
export class CommentDto {
  /** Comment id. */
  @ApiProperty({example: 1})
  id: number;

  /** The commented item. */
  @ApiProperty({example: 3})
  musicItemId: number;

  /** Author of the comment. */
  @ApiProperty({type: UserDto})
  user: UserDto;

  /** Comment text. */
  @ApiProperty({example: 'Side B is a masterpiece.'})
  text: string;

  /** When the comment was written. */
  @ApiProperty()
  createdAt: Date;

  /**
   * Maps a comment entity to its DTO.
   *
   * @param comment - The entity, with the `user` relation loaded.
   * @returns The DTO.
   */
  static from(comment: Comment): CommentDto {
    return {
      id: comment.id,
      musicItemId: comment.musicItemId,
      user: UserDto.from(comment.user),
      text: comment.text,
      createdAt: comment.createdAt,
    };
  }
}
