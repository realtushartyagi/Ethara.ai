import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsISO8601,
} from 'class-validator';
import { ProjectStatus } from '@prisma/client';

/**
 * Data transfer object for creating a new project.
 */
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsISO8601()
  @IsOptional()
  dueDate?: string;
}
