import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CreateOrderDto, OrderResponseDto, OrderItemResponseDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemsRepo: Repository<OrderItem>,
  ) {}

  async create(dto: CreateOrderDto): Promise<OrderResponseDto> {
    const order = this.ordersRepo.create({
      email: dto.email,
      status: 'created',
      total: '1.00', // for level 1, hardcode a price
    });
    const savedOrder = await this.ordersRepo.save(order);

    // Create order item
    const item = this.itemsRepo.create({
      order: savedOrder,
      productId: dto.productId,
      signedUrl: null,
    });
    const savedItem = await this.itemsRepo.save(item);

    return this.mapToResponse(savedOrder, [savedItem]);
  }

  async markPaid(orderId: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepo.findOneOrFail({
      where: { id: orderId },
      relations: ['items'],
    });
    order.status = 'paid';
    const updated = await this.ordersRepo.save(order);
    return this.mapToResponse(updated, updated.items);
  }

  async fulfill(orderId: string, signedUrl: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepo.findOneOrFail({
      where: { id: orderId },
      relations: ['items'],
    });

    // Update all items with signed URL
    order.items.forEach((item) => {
      item.signedUrl = signedUrl;
    });
    await this.itemsRepo.save(order.items);

    // Mark order as fulfilled
    order.status = 'fulfilled';
    const updated = await this.ordersRepo.save(order);

    return this.mapToResponse(updated, updated.items);
  }

  async get(id: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepo.findOneOrFail({
      where: { id },
      relations: ['items'],
    });
    return this.mapToResponse(order, order.items);
  }

  private mapToResponse(order: Order, items: OrderItem[]): OrderResponseDto {
    return {
      id: order.id,
      email: order.email,
      status: order.status,
      total: order.total,
      items: items.map(
        (item): OrderItemResponseDto => ({
          id: item.id,
          productId: item.productId,
          signedUrl: item.signedUrl,
        }),
      ),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
