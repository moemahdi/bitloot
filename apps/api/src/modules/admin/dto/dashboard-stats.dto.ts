import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
    @ApiProperty({ description: 'Total revenue in USD (cents)', example: 125000 })
    totalRevenue!: number;

    @ApiProperty({ description: 'Total number of orders', example: 150 })
    totalOrders!: number;

    @ApiProperty({ description: 'Total number of registered users', example: 85 })
    totalUsers!: number;

    @ApiProperty({ description: 'Active orders (pending/processing)', example: 12 })
    activeOrders!: number;

    @ApiProperty({
        description: 'Revenue history for the last 7 days',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                date: { type: 'string', example: '2023-11-20' },
                revenue: { type: 'number', example: 1500 },
            },
        },
    })
    revenueHistory!: { date: string; revenue: number }[];
}
