import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [DonationsController],
  providers: [DonationsService],
  exports: [DonationsService],
})
export class DonationsModule {}