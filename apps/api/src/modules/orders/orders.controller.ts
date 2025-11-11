import { Body, Controller, Get, Param, Post, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto, OrderResponseDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  create(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.orders.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  get(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.orders.get(id);
  }

  @Patch(':id/reservation')
  @ApiOperation({ summary: 'Set Kinguin reservation ID (test/internal use)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async setReservation(
    @Param('id') id: string,
    @Body() body: { reservationId: string },
  ): Promise<OrderResponseDto> {
    await this.orders.setReservationId(id, body.reservationId);
    return this.orders.get(id);
  }
}
