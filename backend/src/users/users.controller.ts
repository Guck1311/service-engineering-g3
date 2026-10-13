import {Controller, Get, Param, ParseIntPipe} from '@nestjs/common';
import {ApiOkResponse, ApiOperation, ApiTags} from '@nestjs/swagger';
import {ApiErrors} from '../common/api-error.dto.js';
import {Public} from '../common/auth.decorators.js';
import {UserDto} from './dto/user.dto.js';
import {UsersService} from './users.service.js';

/** Read-only endpoints under `/users`; there is no user management in exercise 1. */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * `GET /users` – lists all seeded users. Public, so a client can offer
   * a user selection before it knows a user id.
   *
   * @returns All users.
   */
  @Get()
  @Public()
  @ApiOperation({summary: 'List all (seeded) users; no X-User-Id needed'})
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
  @ApiErrors(401, 404)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    return UserDto.from(await this.usersService.getById(id));
  }
}
