import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { hashPassword } from './password.util';
import type { UserResponseDto } from './dto/user.dto';

/**
 * User Service: Manages user account creation and email confirmation
 * Phase 2 focuses on OTP-based authentication (passwordless)
 * Password support will be added in Phase 3
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  /**
   * Find user by email (normalized to lowercase)
   * @param email User email address
   * @returns User if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepo.findOne({
      where: { email: normalizedEmail },
    });
    return user ?? null;
  }

  /**
   * Find user by ID
   * @param id User UUID
   * @returns User if found, null otherwise
   */
  async findById(id: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: { id },
    });
    return user ?? null;
  }

  /**
   * Create new user (called on first OTP verification)
   * @param email User email address
   * @returns Newly created User entity
   */
  async create(email: string): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await this.findByEmail(normalizedEmail);
    if (existing !== null) {
      this.logger.warn(`User ${normalizedEmail} already exists, returning existing user`);
      return existing;
    }

    // Create new user
    const user = this.userRepo.create({
      email: normalizedEmail,
      emailConfirmed: false,
    });

    const saved = await this.userRepo.save(user);
    this.logger.log(`✅ New user created: ${normalizedEmail}`);

    return saved;
  }

  /**
   * Confirm email for user (called after OTP verification)
   * @param email User email address
   * @returns Updated user
   */
  async confirmEmail(email: string): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.findByEmail(normalizedEmail);

    if (user === null || user === undefined) {
      throw new NotFoundException(`User ${normalizedEmail} not found`);
    }

    user.emailConfirmed = true;
    user.confirmedAt = new Date();

    const updated = await this.userRepo.save(user);
    this.logger.log(`✅ Email confirmed for user ${normalizedEmail}`);

    return updated;
  }

  /**
   * Convert user entity to response DTO (excludes sensitive fields)
   * @param user User entity
   * @returns UserResponseDto (safe for API response)
   */
  toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      emailConfirmed: user.emailConfirmed,
      createdAt: user.createdAt,
    };
  }

  /**
   * Update user password
   * @param userId User ID
   * @param newPassword Plain text password
   * @returns Updated user entity
   */
  async updatePassword(userId: string, newPassword: string): Promise<User> {
    const user = await this.findById(userId);

    if (user === null) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    user.passwordHash = passwordHash;
    const updated = await this.userRepo.save(user);

    this.logger.log(`✅ Password updated for user ${user.email}`);

    return updated;
  }
}
