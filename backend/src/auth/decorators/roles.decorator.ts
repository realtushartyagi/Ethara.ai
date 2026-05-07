import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Decorator to define required roles for a route.
 * @param roles List of allowed roles.
 */
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
