import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoCode } from './entities/promocode.entity';
import { PromoRedemption } from './entities/promoredemption.entity';
import { PromosService } from './promos.service';
import { PromosController, AdminPromosController } from './promos.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([PromoCode, PromoRedemption]),
    ],
    controllers: [PromosController, AdminPromosController],
    providers: [PromosService],
    exports: [PromosService],
})
export class PromosModule { }
