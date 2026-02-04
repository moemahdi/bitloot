import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { hashPassword } from '../auth/password.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
    });
  }

  async create(email: string, passwordHash?: string): Promise<User> {
    const isOtpOnly = passwordHash === undefined;
    const user = this.repo.create({
      email,
      passwordHash,
      emailConfirmed: isOtpOnly, // OTP confirms email automatically
    });
    return this.repo.save(user);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.findByIdOrThrow(userId);
    const hash = await hashPassword(newPassword);
    user.passwordHash = hash;
    await this.repo.save(user);
  }

  async confirmEmail(userId: string): Promise<void> {
    const user = await this.findByIdOrThrow(userId);
    user.emailConfirmed = true;
    await this.repo.save(user);
  }

  async setRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    const user = await this.findByIdOrThrow(userId);
    user.role = role;
    await this.repo.save(user);
  }

  /**
   * Update user's lastLoginAt timestamp
   * Called after successful OTP verification
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.repo.update(userId, { lastLoginAt: new Date() });
  }

  private async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (user === null) throw new NotFoundException('User not found');
    return user;
  }
}
