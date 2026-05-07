import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * Data transfer object for adding a member to a project.
 */
export class AddMemberDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
