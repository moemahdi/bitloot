import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { AdminReviewsController } from './admin-reviews.controller';
import { Review } from '../../database/entities/review.entity';
import { Order } from '../orders/order.entity';
import { User } from '../../database/entities/user.entity';
import { Product } from '../catalog/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Order, User, Product]),
  ],
  providers: [ReviewsService],
  controllers: [ReviewsController, AdminReviewsController],
  exports: [ReviewsService],
})
export class ReviewsModule {}
