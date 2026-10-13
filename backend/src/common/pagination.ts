import {Type} from '@nestjs/common';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {Type as TransformType} from 'class-transformer';
import {IsInt, IsOptional, Max, Min} from 'class-validator';

/**
 * Query parameters `?page=&limit=` shared by all paginated list endpoints.
 * Resource-specific query DTOs extend this class with their filters.
 */
export class PaginationQueryDto {
  /** 1-based page number (default 1). */
  @ApiPropertyOptional({minimum: 1, default: 1})
  @IsOptional()
  @TransformType(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  /** Items per page, 1 to 100 (default 20). */
  @ApiPropertyOptional({minimum: 1, maximum: 100, default: 20})
  @IsOptional()
  @TransformType(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  /** Number of items to skip, for TypeORM's `skip` option. */
  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

/** Pagination details returned with every page. */
export class PageMetaDto {
  /** Current page number. */
  @ApiProperty({example: 1})
  page: number;

  /** Requested page size. */
  @ApiProperty({example: 20})
  limit: number;

  /** Total number of items across all pages. */
  @ApiProperty({example: 57})
  total: number;
}

/**
 * Response envelope of a paginated list.
 *
 * @typeParam T - Type of the items in the list.
 */
export interface Page<T> {
  /** Items on the current page. */
  data: T[];
  /** Page number, size and total count. */
  meta: PageMetaDto;
}

/**
 * Wraps one page of results in the {@link Page} envelope.
 *
 * @param data - Items on the current page.
 * @param total - Total number of matching items.
 * @param query - The pagination query that produced the page.
 * @returns The page with its metadata.
 */
export function toPage<T>(
  data: T[],
  total: number,
  query: PaginationQueryDto,
): Page<T> {
  return {data, meta: {page: query.page, limit: query.limit, total}};
}

/**
 * Creates a concrete `{ data, meta }` class for one item type so Swagger can
 * document it (Swagger cannot read TypeScript generics).
 *
 * @param itemType - DTO class of the list items.
 * @returns A class named `<ItemType>Page`, for use in `@ApiOkResponse({ type })`.
 */
export function PageDto<T>(itemType: Type<T>): Type<Page<T>> {
  class PageOfItems implements Page<T> {
    @ApiProperty({type: [itemType]})
    data: T[];

    @ApiProperty({type: PageMetaDto})
    meta: PageMetaDto;
  }
  Object.defineProperty(PageOfItems, 'name', {value: `${itemType.name}Page`});
  return PageOfItems;
}
