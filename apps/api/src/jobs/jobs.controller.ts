import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Roles } from '../common/decorators';

/**
 * Internal dashboard endpoints for queue health + dead-letter management.
 * Requires authenticated session; admin role for retry actions.
 */
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * GET /jobs/metrics
   * Returns live BullMQ job counts per queue.
   * Useful for monitoring dashboards and alerting on backlog growth.
   */
  @Get('metrics')
  getMetrics() {
    return this.jobsService.getQueueMetrics();
  }

  /**
   * GET /jobs/failed
   * Lists dead-letter records — jobs that exhausted all retries.
   * Query params: queue, practiceId, limit (max 200)
   */
  @Get('failed')
  listFailed(
    @Query('queue') queue?: string,
    @Query('practiceId') practiceId?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const limit = limitRaw ? Math.min(parseInt(limitRaw, 10), 200) : 100;
    if (limitRaw && isNaN(limit)) throw new BadRequestException('limit must be a number');
    return this.jobsService.listFailedJobs({ queue, practiceId, limit });
  }

  /**
   * POST /jobs/failed/:id/retry
   * Marks a dead-letter record as retried.
   * The caller is responsible for re-enqueuing the job via the appropriate endpoint.
   */
  @Post('failed/:id/retry')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  retryFailed(@Param('id') id: string) {
    return this.jobsService.markRetried(id);
  }
}
