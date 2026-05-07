import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

/**
 * Data transfer object for updating an existing project.
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
