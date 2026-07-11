import { Controller, Get, Query, Req } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('q') query: string,
    @Req() req: any,
    @Query('type') type?: string,
  ): Promise<unknown> {
    // practiceId always from the session so results can never span other tenants.
    return this.searchService.search({ query, type, practiceId: req.user.practiceId });
  }
}
