import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { setupSchedulers } from './schedulers';

@Module({
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    try {
      await setupSchedulers();
    } catch (err) {
      console.error('[JobsModule] Failed to set up schedulers:', err);
    }
  }
}
