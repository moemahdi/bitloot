import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Order } from '../modules/orders/order.entity';
import { OrderItem } from '../modules/orders/order-item.entity';
import { Key } from '../modules/orders/key.entity';
import { Payment } from '../modules/payments/payment.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import { User } from './entities/user.entity';
import { AuditLog } from './entities/audit-log.entity';
import { EmailBounce } from './entities/email-bounce.entity';
import { Review } from './entities/review.entity';
import { WatchlistItem } from './entities/watchlist-item.entity';
import { Product } from '../modules/catalog/entities/product.entity';
import { ProductOffer } from '../modules/catalog/entities/product-offer.entity';
import { ProductGroup } from '../modules/catalog/entities/product-group.entity';
import { DynamicPricingRule } from '../modules/catalog/entities/dynamic-pricing-rule.entity';
import { Session } from './entities/session.entity';
import { InitOrders1710000000000 } from './migrations/1710000000000-InitOrders';
import { AddKeysReservation1720000000000 } from './migrations/1720000000000-add-keys-reservation';
import { CreatePayments1730000000001 } from './migrations/1730000000001-CreatePayments';
import { CreateWebhookLogs1730000000002 } from './migrations/1730000000002-CreateWebhookLogs';
import { UpdateOrdersStatusEnum1730000000003 } from './migrations/1730000000003-UpdateOrdersStatusEnum';
import { CreateUsers1735000000000 } from './migrations/1735000000000-CreateUsers';
import { CreateAuditLogs1731700000000 } from './migrations/1731700000000-CreateAuditLogs';
import { CreateEmailBounces1735604400000 } from './migrations/1735604400000-CreateEmailBounces';
import { RefactorProductPrice1763647677731 } from './migrations/1763647677731-RefactorProductPrice';
import { AddEncryptionKeyToKey1763652000000 } from './migrations/1763652000000-AddEncryptionKeyToKey';
import { EnsureAdminUser1763653000000 } from './migrations/1763653000000-EnsureAdminUser';
import { AddSourceType1764000000000 } from './migrations/1764000000000-AddSourceType';
import { ExpandProductColumnLengths1764200000000 } from './migrations/1764200000000-ExpandProductColumnLengths';
import { AddKinguinProductFields1764300000000 } from './migrations/1764300000000-AddKinguinProductFields';
import { MakePricingRuleProductIdNullable1764400000000 } from './migrations/1764400000000-MakePricingRuleProductIdNullable';
import { CreateProductGroups1765000000000 } from './migrations/1765000000000-CreateProductGroups';
import { CreateReviews1766000000000 } from './migrations/1766000000000-CreateReviews';
import { MakeReviewOrderIdNullable1766000000001 } from './migrations/1766000000001-MakeReviewOrderIdNullable';
import { CreateWatchlist1767000000000 } from './migrations/1767000000000-CreateWatchlist';
import { UpdateWebhookIdempotencyConstraint1735827000000 } from './migrations/1735827000000-UpdateWebhookIdempotencyConstraint';
import { AddContentTypeToKeys1735840000000 } from './migrations/1735840000000-AddContentTypeToKeys';
import { LinkOrdersToUsersByEmail1767100000000 } from './migrations/1767100000000-LinkOrdersToUsersByEmail';
import { AddCompletionEmailSent1767200000000 } from './migrations/1767200000000-AddCompletionEmailSent';
import { AddOrderItemPriceQuantity1736450000000 } from './migrations/1736450000000-AddOrderItemPriceQuantity';
import { CreateUserSessions1768000000000 } from './migrations/1768000000000-CreateUserSessions';
import { AddUserDeletionRequestedAt1768100000000 } from './migrations/1768100000000-AddUserDeletionRequestedAt';
import { AddKeyAuditFields1768200000000 } from './migrations/1768200000000-AddKeyAuditFields';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Order, OrderItem, Key, Payment, WebhookLog, User, AuditLog, EmailBounce, Review, WatchlistItem, Product, ProductOffer, ProductGroup, DynamicPricingRule, Session],
  migrations: [
    InitOrders1710000000000,
    AddKeysReservation1720000000000,
    CreatePayments1730000000001,
    CreateWebhookLogs1730000000002,
    UpdateOrdersStatusEnum1730000000003,
    CreateUsers1735000000000,
    CreateAuditLogs1731700000000,
    CreateEmailBounces1735604400000,
    RefactorProductPrice1763647677731,
    AddEncryptionKeyToKey1763652000000,
    EnsureAdminUser1763653000000,
    AddSourceType1764000000000,
    ExpandProductColumnLengths1764200000000,
    AddKinguinProductFields1764300000000,
    MakePricingRuleProductIdNullable1764400000000,
    CreateProductGroups1765000000000,
    CreateReviews1766000000000,
    MakeReviewOrderIdNullable1766000000001,
    CreateWatchlist1767000000000,
    UpdateWebhookIdempotencyConstraint1735827000000,
    AddContentTypeToKeys1735840000000,
    LinkOrdersToUsersByEmail1767100000000,
    AddCompletionEmailSent1767200000000,
    AddOrderItemPriceQuantity1736450000000,
    CreateUserSessions1768000000000,
    AddUserDeletionRequestedAt1768100000000,
    AddKeyAuditFields1768200000000,
  ],
  logging: true,
  synchronize: false,
});
