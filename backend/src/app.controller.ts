import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  HttpCode,
  Body,
  Param,
  ParseIntPipe,
  Headers,
  Res,
} from '@nestjs/common';

import { AppService } from './app.service.js';
import { MusicItemEntity } from './music-item.entity.js';
import type { CreateMusicItem } from './music-item.interface.js';
import type { Response } from 'express';
import { SetRatingDto } from './dto/set-rating.dto.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('music-items')
  getMusicItems(): Promise<MusicItemEntity[]> {
    return this.appService.getMusicItems();
  }

  @Get('music-items/:id')
  getMusicItemById(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.appService.getMusicItemDetails(id);
  }
  @Get('music-items/:id/tracks')
  getMusicItemTracks(
    @Param('id', ParseIntPipe) id: number
  ): Promise<MusicItemEntity[]> {
    return this.appService.getMusicItemTracks(id);
  }
  @Post('music-items')
  addMusicItem(
    @Body() data: CreateMusicItem,
    @Headers('x-user-id') callerHeader: string | undefined
  ) {
    return this.appService.addMusicItem(data, callerHeader);
  }

  @Put('music-items/:id')
  updateMusicItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreateMusicItem,
    @Headers('x-user-id') callerHeader: string | undefined
  ) {
    return this.appService.updateMusicItem(id, data, callerHeader);
  }

  @Delete('music-items/:id')
  @HttpCode(204)
  deleteMusicItem(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') callerHeader: string | undefined
  ): Promise<void> {
    return this.appService.deleteMusicItem(id, callerHeader);
  }

  @Get('users')
  getUsers() {
    return this.appService.getUsers();
  }

  @Get('users/:id/collection')
  getUserCollection(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.appService.getUserCollection(id);
  }

  @Get('collections')
  getAllCollections() {
    return this.appService.getAllCollections();
  }

  @Post('users/:id/collection')
  addToCollection(
    @Param('id', ParseIntPipe) userId: number,
    @Body() body: { musicItemId: number },
    @Headers('x-user-id') callerHeader: string | undefined
  ) {
    return this.appService.addToCollection(
      userId,
      body?.musicItemId,
      callerHeader,
    );
  }
  @Delete('users/:id/collection/:itemId')
  @HttpCode(204)
  removeFromCollection(
    @Param('id', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) musicItemId: number,
    @Headers('x-user-id') callerHeader: string | undefined
  ): Promise<void> {
    return this.appService.removeFromCollection(
      userId,
      musicItemId,
      callerHeader,
    );
  }
  @Patch('users/:id/collection/:itemId')
  updateCollectionEntry(
    @Param('id', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) musicItemId: number,
    @Body() data: {
      reaction?: 'NONE' | 'LIKE' | 'DISLIKE';
      favourite?: boolean;
    },
    @Headers('x-user-id') callerHeader: string | undefined
  ) {
    return this.appService.updateCollectionEntry(
      userId,
      musicItemId,
      data,
      callerHeader,
    );
  }
  @Get('music-items/:id/comments')
  getComments(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.appService.getComments(id);
  }

  @Post('music-items/:id/comments')
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { text: string },
    @Headers('x-user-id') callerHeader: string | undefined
  ) {
    return this.appService.addComment(
      id,
      body?.text,
      callerHeader,
    );
  }

  @Get('music-items/:id/ratings')
  getRatings(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.appService.getRatings(id);
  }

  @Put('music-items/:id/ratings/:userId')
  async setRating(
    @Param('id', ParseIntPipe) musicItemId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: SetRatingDto,
    @Headers('x-user-id') callerHeader: string | undefined,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.appService.setRating(
      musicItemId,
      userId,
      body?.stars,
      callerHeader,
    );

    response.status(result.created ? 201 : 200);

    return result.rating;
  }
}