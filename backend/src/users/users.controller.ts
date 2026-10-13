import {Controller, Get, Param, ParseIntPipe} from '@nestjs/common';
import {ApiOkResponse, ApiOperation, ApiTags} from '@nestjs/swagger';
import {ApiErrors} from '../common/api-error.dto.js';
import {UserDto} from './dto/user.dto.js';
import {UsersService} from './users.service.js';

/** Read-only endpoints under `/users`; there is no user management in exercise 1. */
@ApiTags('users')
@ApiErrors(401)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * `GET /users` – lists all seeded users.
   *
   * @returns All users.
   */
  @Get()
  @ApiOperation({summary: 'List all (seeded) users'})
  @ApiOkResponse({type: [UserDto]})
  async findAll(): Promise<UserDto[]> {
    const users = await this.usersService.findAll();
    return users.map(UserDto.from);
  }

  /**
   * `GET /users/{id}` – returns one user.
   *
   * @param id - User id from the path.
   * @returns The user.
   * @throws NotFoundException if the user does not exist.
   */
  @Get(':id')
  @ApiOperation({summary: 'Get one user'})
  @ApiOkResponse({type: UserDto})
  @ApiErrors(404)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    return UserDto.from(await this.usersService.getById(id));
  }
}
