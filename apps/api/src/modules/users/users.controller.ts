import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UserResponseDto, UpdatePasswordDto } from './dto/user.dto';
import { verifyPassword } from '../auth/password.util';

interface AuthenticatedRequest extends ExpressRequest {
  user: { id: string; email: string; role: 'user' | 'admin' };
}


@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getProfile(@Request() req: AuthenticatedRequest): Promise<UserResponseDto> {
    const user = await this.usersService.findById(req.user.id);
    if (user === null) throw new BadRequestException('User not found');
    return {
      id: user.id,
      email: user.email,
      emailConfirmed: user.emailConfirmed,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: 200, description: 'Password updated' })
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    const user = await this.usersService.findById(req.user.id);
    if (user === null) throw new BadRequestException('User not found');

    // Verify old password
    if (
      user.passwordHash === undefined ||
      !(await verifyPassword(dto.oldPassword, user.passwordHash))
    ) {
      throw new BadRequestException('Invalid current password');
    }

    // Set new password
    await this.usersService.updatePassword(req.user.id, dto.newPassword);
    return { success: true };
  }

  @Get('me/orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Get user's orders" })
  @ApiResponse({ status: 200, isArray: true })
  getOrders(_req: AuthenticatedRequest): Promise<Record<string, unknown>[]> {
    // Placeholder: will be implemented when integrating with OrdersService
    return Promise.resolve([]);
  }
}
