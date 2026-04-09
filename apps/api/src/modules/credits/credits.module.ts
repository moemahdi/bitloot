import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCredits } from './entities/user-credits.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { CreditTopup } from './entities/credit-topup.entity';
import { CreditsService } from './credits.service';
import { CreditsTopupService } from './credits-topup.service';
import { CreditsController } from './credits.controller';
import { AdminCreditsController } from './admin-credits.controller';
import { CreditsExpiryService } from './credits-expiry.processor';
import { EmailsModule } from '../emails/emails.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCredits, CreditTransaction, CreditTopup]),
    forwardRef(() => EmailsModule),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [CreditsController, AdminCreditsController],
  providers: [CreditsService, CreditsTopupService, CreditsExpiryService],
  exports: [CreditsService, CreditsTopupService],
})
export class CreditsModule {}
