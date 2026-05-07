import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Data transfer object for user login.
 */
export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
