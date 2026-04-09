import { BadRequestException } from '@nestjs/common';

export class InsufficientCreditsError extends BadRequestException {
  constructor(requested: number, available: number) {
    super(`Insufficient credits: requested €${requested.toFixed(2)}, available €${available.toFixed(2)}`);
  }
}

export class BalanceCapExceededError extends BadRequestException {
  constructor(currentBalance: number, topupAmount: number, cap: number) {
    super(
      `Balance cap exceeded: current €${currentBalance.toFixed(2)} + top-up €${topupAmount.toFixed(2)} > cap €${cap.toFixed(2)}. Spend credits first.`,
    );
  }
}

export class DailyTopupLimitError extends BadRequestException {
  constructor() {
    super('Daily top-up limit of €1,000 reached. Try again tomorrow.');
  }
}

export class TopupRateLimitError extends BadRequestException {
  constructor() {
    super('Too many top-up requests. Please try again later.');
  }
}

export class CreditLoopError extends BadRequestException {
  constructor() {
    super('Cannot use credits to pay for credit top-ups.');
  }
}
