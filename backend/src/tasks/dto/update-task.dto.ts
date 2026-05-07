import { PartialType } from '@nestjs/mapped-types';
import { TaskStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

/**
 * Data transfer object for updating an existing task.
 */
export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
