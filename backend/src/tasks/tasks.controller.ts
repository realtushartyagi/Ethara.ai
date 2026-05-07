import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { TasksService } from './tasks.service';
import { Role } from '@prisma/client';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task (project admin only)' })
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: { userId: string }) {
    return this.tasksService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List tasks with filters, sorting, and pagination' })
  findAll(
    @Query() filters: FilterTasksDto,
    @CurrentUser() user: { userId: string; role: Role },
  ) {
    return this.tasksService.findAll(filters, user.userId, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task details' })
  findOne(@Param('id') id: string, @CurrentUser() user: { userId: string; role: Role }) {
    return this.tasksService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update task (admin: all fields, member: status only)',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.tasksService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task (project admin only)' })
  delete(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.tasksService.delete(id, user.userId);
  }
}
