import { describe, it, expect, beforeEach } from 'vitest';
import { type TestingModule, Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return healthy status', () => {
    const result = controller.healthz();
    expect(result).toHaveProperty('ok', true);
    expect(result).toHaveProperty('timestamp');
  });
});
