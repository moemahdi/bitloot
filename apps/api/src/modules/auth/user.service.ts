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
   * Check if email belongs to a soft-deleted user
   * Used to show proper error message on login attempt
   * @param email User email address
   * @returns true if account was deleted
   */
  async isEmailDeleted(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const deletedUser = await this.userRepo.findOne({
      where: { email: normalizedEmail },
      withDeleted: true, // Include soft-deleted users
    });
    // User exists with deletedAt set = account was deleted
    return deletedUser?.deletedAt !== null && deletedUser?.deletedAt !== undefined;
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
   * Update user's lastLoginAt timestamp
   * Called after successful OTP verification
   * @param userId User ID
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepo.update(userId, { lastLoginAt: new Date() });
    this.logger.log(`🕐 Last login updated for user ${userId}`);
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
      role: user.role,
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

  /**
   * Set pending email for email change verification
   * @param userId User ID
   * @param newEmail New email to verify
   */
  async setPendingEmail(userId: string, newEmail: string): Promise<void> {
    const normalizedEmail = newEmail.toLowerCase().trim();
    const user = await this.findById(userId);

    if (user === null) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Check if new email is already in use
    const existing = await this.findByEmail(normalizedEmail);
    if (existing !== null && existing.id !== userId) {
      throw new Error('Email address is already in use');
    }

    user.pendingEmail = normalizedEmail;
    await this.userRepo.save(user);

    this.logger.log(`📧 Pending email set for user ${userId}: ${normalizedEmail}`);
  }

  /**
   * Complete email change after OTP verification
   * @param userId User ID
   * @returns Updated user
   */
  async confirmEmailChange(userId: string): Promise<User> {
    const user = await this.findById(userId);

    if (user === null) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (user.pendingEmail === undefined || user.pendingEmail === null || user.pendingEmail === '') {
      throw new Error('No pending email change found');
    }

    const oldEmail = user.email;
    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailConfirmed = true;
    user.confirmedAt = new Date();

    const updated = await this.userRepo.save(user);

    this.logger.log(`✅ Email changed for user ${userId}: ${oldEmail} → ${user.email}`);

    return updated;
  }

  /**
   * Get pending email for a user
   * @param userId User ID
   * @returns Pending email or null
   */
  async getPendingEmail(userId: string): Promise<string | null> {
    const user = await this.findById(userId);
    return user?.pendingEmail ?? null;
  }

  /**
   * Request account deletion (starts 30-day grace period)
   * @param userId User ID
   * @returns Deletion date (30 days from now)
   */
  async requestDeletion(userId: string): Promise<Date> {
    const user = await this.findById(userId);

    if (user === null) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Already has deletion request?
    if (user.deletionRequestedAt !== null && user.deletionRequestedAt !== undefined) {
      const deletionDate = new Date(user.deletionRequestedAt);
      deletionDate.setDate(deletionDate.getDate() + 30);
      return deletionDate;
    }

    user.deletionRequestedAt = new Date();
    await this.userRepo.save(user);

    const deletionDate = new Date(user.deletionRequestedAt);
    deletionDate.setDate(deletionDate.getDate() + 30);

    this.logger.log(`⚠️ Account deletion requested for user ${user.email}. Will be deleted on ${deletionDate.toISOString()}`);

    return deletionDate;
  }

  /**
   * Cancel account deletion request
   * @param userId User ID
   */
  async cancelDeletion(userId: string): Promise<void> {
    const user = await this.findById(userId);

    if (user === null) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (user.deletionRequestedAt === null || user.deletionRequestedAt === undefined) {
      throw new Error('No deletion request found');
    }

    // Use null to clear the column in the database
    // TypeORM treats undefined as "don't update" but null as "set to NULL"
    user.deletionRequestedAt = null;
    await this.userRepo.save(user);

    this.logger.log(`✅ Account deletion cancelled for user ${user.email}`);
  }

  /**
   * Get deletion status for a user
   * @param userId User ID
   * @returns Object with deletionRequestedAt, deletionDate, daysRemaining or null
   */
  async getDeletionStatus(
    userId: string,
  ): Promise<{ deletionRequestedAt: Date; deletionDate: Date; daysRemaining: number } | null> {
    const user = await this.findById(userId);

    if (user?.deletionRequestedAt === null || user?.deletionRequestedAt === undefined) {
      return null;
    }

    const deletionDate = new Date(user.deletionRequestedAt);
    deletionDate.setDate(deletionDate.getDate() + 30);

    const now = new Date();
    const msRemaining = deletionDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    return {
      deletionRequestedAt: user.deletionRequestedAt,
      deletionDate,
      daysRemaining,
    };
  }

  /**
   * Permanently delete user (called after 30-day grace period)
   * @param userId User ID
   */
  async permanentlyDelete(userId: string): Promise<void> {
    const user = await this.findById(userId);

    if (user === null) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Soft delete (TypeORM sets deletedAt)
    await this.userRepo.softDelete(userId);

    this.logger.log(`🗑️ User ${user.email} permanently deleted`);
  }

  /**
   * Find users pending deletion (deletionRequestedAt + 30 days < now)
   * Used by cleanup cron job
   */
  async findUsersPendingPermanentDeletion(): Promise<User[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.userRepo
      .createQueryBuilder('user')
      .where('user.deletionRequestedAt IS NOT NULL')
      .andWhere('user.deletionRequestedAt <= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('user.deletedAt IS NULL')
      .getMany();
  }
}
