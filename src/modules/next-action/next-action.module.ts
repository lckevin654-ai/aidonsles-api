import { Module } from '@nestjs/common';
import { NextActionController } from './next-action.controller';
import { NextActionService } from './next-action.service';

@Module({
  controllers: [NextActionController],
  providers: [NextActionService],
})
export class NextActionModule {}