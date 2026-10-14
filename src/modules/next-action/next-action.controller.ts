import { Controller, Get } from '@nestjs/common';
import { NextActionService } from './next-action.service';

@Controller('next-action')
export class NextActionController {
  constructor(private readonly nextActionService: NextActionService) {}

  @Get()
  async getNext() {
    return this.nextActionService.getNext();
  }
}