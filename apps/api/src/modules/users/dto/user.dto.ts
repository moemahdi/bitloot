import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, IsUUID } from 'class-validator';

export class UserResponseDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  emailConfirmed!: boolean;

  @ApiProperty()
  @IsEnum(['user', 'admin'])
  role!: 'user' | 'admin';

  @ApiProperty()
  createdAt!: Date;
}

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false })
  @IsString()
  passwordHash?: string;
}

export class UpdatePasswordDto {
  @ApiProperty()
  @IsString()
  oldPassword!: string;

  @ApiProperty()
  @IsString()
  newPassword!: string;
}
