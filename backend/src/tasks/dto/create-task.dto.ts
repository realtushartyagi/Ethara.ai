import { Priority, TaskStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Data transfer object for creating a new task.
 */
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsOptional()
  @Transform(({ value }: { value: any }) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' && value.trim() !== '') return new Date(value);
    return null;
  })
  @IsDate()
  dueDate?: Date;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}
