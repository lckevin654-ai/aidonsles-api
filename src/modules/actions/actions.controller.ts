import { Controller, Get, Param } from '@nestjs/common';
import { ActionsService } from './actions.service';

@Controller('actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get()
  async findAll() {
    return this.actionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.actionsService.findOne(id);
  }
}