import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { setupSchedulers } from './schedulers';

@Module({})
export class JobsModule implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    try {
      await setupSchedulers();
    } catch (err) {
      console.error('[JobsModule] Failed to set up schedulers:', err);
    }
  }
}
