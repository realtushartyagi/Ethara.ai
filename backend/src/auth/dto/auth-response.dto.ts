import { Role } from '@prisma/client';

/**
 * Data transfer object for the authentication response.
 */
export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}
