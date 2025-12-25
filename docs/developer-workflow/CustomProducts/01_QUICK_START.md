# Kinguin Integration: Quick Start Guide

**TL;DR:** You have a working custom product system. Now add Kinguin products alongside it without breaking anything.

---

## The Big Picture (5 mins read)

```
Your System Today          →  Your System Tomorrow
═════════════════════          ══════════════════════════
Only Custom Products      →   Custom + Kinguin Products
You upload keys manually   →   Kinguin uploads automatically
Fixed to your products     →   Access to 50k Kinguin products
Manual per product         →   Automated for Kinguin products
```

**Key Insight:** You're not replacing anything. You're adding a second fulfillment method. Custom products work forever.

---

## Step 1: Get Kinguin Credentials (Today, 30 mins)

### Go here:
1. Visit kinguin.com/account (Merchant Dashboard)
2. Navigate to "API Keys"
3. Create a **Sandbox** API key:
   - [ ] Copy API Key
   - [ ] Generate Webhook Secret
   - [ ] Copy Webhook Secret

### Add to your `.env.local`:
```bash
KINGUIN_API_KEY=your_api_key_here
KINGUIN_WEBHOOK_SECRET=your_webhook_secret_here
KINGUIN_API_BASE_URL=https://sandbox.kinguin.net/api/v1
KINGUIN_ENABLED=false
```

### Test it works:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://sandbox.kinguin.net/api/v1/health
```

Expected response: `200 OK`

✅ **You're done with Step 1 when:** Curl returns 200 and `.env` is updated

---

## Step 2: Create Test Kinguin Products (Tomorrow, 1 hour)

### In Kinguin Merchant Dashboard:
1. Create 2-3 test offers (in sandbox)
2. For each, note the **Offer ID** (e.g., `12345-67890`)
3. Set retail pricing with your margin

### In your BitLoot admin:
1. Create 3 new products manually
2. Set `sourceType = 'kinguin'` (future: UI will have dropdown)
3. Set `kinguinOfferId = '12345-67890'`

```typescript
// Temporary: Add to seeding script or directly in DB
const product = await db.product.create({
  title: "Test Game from Kinguin",
  sourceType: "kinguin",
  kinguinOfferId: "12345-67890",
  retailPrice: new Decimal("19.99"),
  // ... rest of fields
});
```

✅ **You're done with Step 2 when:** 3 test products exist with sourceType='kinguin'

---

## Step 3: Implement Kinguin Client (This Week, 4-6 hours)

### File to create:
`apps/api/src/modules/fulfillment/kinguin.client.ts`

### Minimal implementation (copy-paste ready):

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KinguinClient {
  private readonly logger = new Logger(KinguinClient.name);

  constructor(
    private readonly apiKey: string = process.env.KINGUIN_API_KEY!,
    private readonly baseUrl: string = process.env.KINGUIN_API_BASE_URL!,
  ) {}

  async createOrder(offerId: string, quantity: number = 1): Promise<{
    id: string;
    status: 'pending' | 'ready' | 'failed';
    key?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offerId, quantity, autoDeliver: true }),
      });

      if (!response.ok) {
        throw new Error(`Kinguin API error: ${response.statusText}`);
      }

      const data = await response.json();
      this.logger.log(`Kinguin order created: ${data.id}`);
      return {
        id: data.id,
        status: data.status,
        key: data.key,
      };
    } catch (error) {
      this.logger.error(`Failed to create Kinguin order: ${error}`);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<{
    id: string;
    status: 'pending' | 'ready' | 'failed';
    key?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Kinguin API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        status: data.status,
        key: data.key,
      };
    } catch (error) {
      this.logger.error(`Failed to get Kinguin order status: ${error}`);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### Wire into fulfillment service:

```typescript
// In fulfillment.service.ts

export class FulfillmentService {
  constructor(
    private readonly kinguin: KinguinClient,
    private readonly r2Storage: R2StorageService,
    private readonly ordersService: OrdersService,
    // ... rest
  ) {}

  async fulfillOrder(orderId: string) {
    const order = await this.ordersService.findById(orderId);
    
    if (order.sourceType === 'kinguin') {
      return this.fulfillOrderViaKinguin(orderId);
    }
    // existing custom product logic continues...
  }

  private async fulfillOrderViaKinguin(orderId: string) {
    const order = await this.ordersService.findById(orderId);
    
    // 1. Create Kinguin order
    const kinguinOrder = await this.kinguin.createOrder(
      order.product.kinguinOfferId,
      1,
    );
    
    // 2. Poll for key (max 10 attempts, 2s delay)
    let key: string | undefined;
    for (let i = 0; i < 10; i++) {
      const status = await this.kinguin.getOrderStatus(kinguinOrder.id);
      if (status.key) {
        key = status.key;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (!key) throw new Error('Key not received from Kinguin');
    
    // 3. Encrypt & store
    const encrypted = encryptKey(key, process.env.KEY_ENCRYPTION_SECRET!);
    const { signedUrl, expiresAt } = await this.r2Storage.uploadEncryptedKey(
      orderId,
      encrypted,
    );
    
    // 4. Send email
    await this.emailService.sendOrderCompleted(
      order.email,
      signedUrl,
      expiresAt,
    );
    
    // 5. Update order
    await this.ordersService.markFulfilled(orderId, signedUrl);
  }
}
```

✅ **You're done with Step 3 when:**
- KinguinClient class exists and works
- Test order created via API → key received
- No TypeScript errors

---

## Step 4: Add Webhook Handler (This Week, 2-3 hours)

### File to create:
`apps/api/src/modules/webhooks/kinguin-webhook.controller.ts`

### Minimal implementation:

```typescript
import { Controller, Post, Headers, Req } from '@nestjs/common';
import { createHmac } from 'crypto';
import { FulfillmentService } from '../fulfillment/fulfillment.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly fulfillment: FulfillmentService) {}

  @Post('kinguin')
  async handleKinguinWebhook(
    @Headers('x-kinguin-signature') signature: string,
    @Req() req: any,
  ) {
    // 1. Verify signature
    const raw = JSON.stringify(req.body);
    const expected = createHmac('sha512', process.env.KINGUIN_WEBHOOK_SECRET!)
      .update(raw)
      .digest('hex');

    if (signature !== expected) {
      return { error: 'Invalid signature' };
    }

    // 2. Extract key and order ID from payload
    const { orderId, key } = req.body;

    // 3. Update order with key
    await this.fulfillment.updateOrderWithKey(orderId, key);

    // 4. Return immediately
    return { ok: true };
  }
}
```

### Add method to fulfillment service:

```typescript
async updateOrderWithKey(orderId: string, key: string) {
  // 1. Verify order exists
  const order = await this.ordersService.findById(orderId);
  
  // 2. Encrypt & store
  const encrypted = encryptKey(key, process.env.KEY_ENCRYPTION_SECRET!);
  const { signedUrl, expiresAt } = await this.r2Storage.uploadEncryptedKey(
    orderId,
    encrypted,
  );
  
  // 3. Send email
  await this.emailService.sendOrderCompleted(
    order.email,
    signedUrl,
    expiresAt,
  );
  
  // 4. Mark fulfilled
  await this.ordersService.markFulfilled(orderId, signedUrl);
}
```

✅ **You're done with Step 4 when:**
- Webhook controller exists
- Test webhook can be sent to your localhost
- Order marked as fulfilled

---

## Step 5: Test End-to-End (This Week, 2 hours)

### Manual test checklist:

1. **Create test order:**
   - Browse to test Kinguin product
   - Add to cart
   - Checkout with test payment

2. **Verify fulfillment:**
   - Order status shows "Processing..."
   - Kinguin API called (check logs)
   - Kinguin order created
   - Key received

3. **Verify delivery:**
   - Order status shows "Fulfilled"
   - Email sent with link
   - Click link → download encrypted key

4. **Verify custom products still work:**
   - Create custom product order
   - Manual key delivery (as before)
   - Email sent
   - Order fulfilled

✅ **You're done with Step 5 when:**
- Both Kinguin and custom orders complete successfully
- No errors in logs
- Emails sent correctly

---

## Step 6: Database & Admin UI (Next Week, 3-4 hours)

### Add to Product entity:

```typescript
@Column({ type: 'enum', enum: ['custom', 'kinguin'], default: 'custom' })
sourceType: 'custom' | 'kinguin';

@Column({ type: 'varchar', nullable: true })
kinguinOfferId?: string;
```

### Run migration:

```bash
npm run migration:create -- AddKinguinSourceTracking
npm run migration:run
```

### Update admin form to show source:

```tsx
<RadioGroup>
  <Radio value="custom">Custom</Radio>
  <Radio value="kinguin">Kinguin</Radio>
</RadioGroup>

{sourceType === 'kinguin' && (
  <Input placeholder="Kinguin Offer ID" />
)}
```

### Add column to products table:

```tsx
<TableCell>
  {product.sourceType === 'kinguin' ? (
    <Badge color="blue">Kinguin</Badge>
  ) : (
    <Badge color="green">Custom</Badge>
  )}
</TableCell>
```

✅ **You're done with Step 6 when:**
- Admin can see/edit product source
- Products table shows source badges
- Filtering works

---

## You're Now Live!

At this point:
- ✅ Custom products work (existing system)
- ✅ Kinguin products work (new system)
- ✅ Feature flag `KINGUIN_ENABLED` controls visibility
- ✅ No breaking changes
- ✅ Can rollback anytime

### Next: Deploy & Monitor
1. Deploy with `KINGUIN_ENABLED=false` to production
2. Enable for internal testing only
3. Monitor logs for 1 week
4. Enable for 10% of products
5. Monitor for 1 week
6. Scale to 100%

---

## Troubleshooting

### "Kinguin API returns 401"
- Check API key in `.env`
- Verify you're using sandbox URL in sandbox
- Verify token hasn't expired

### "Webhook not arriving"
- Verify webhook URL is publicly accessible
- Check Kinguin webhook settings in merchant dashboard
- Verify webhook secret matches

### "Key not decrypting on customer end"
- Verify encryption key is same across all workers
- Check key isn't getting corrupted in R2
- Test encryption locally first

### "Custom products stopped working"
- Did you accidentally modify the existing code path?
- Check the `if (order.sourceType === 'kinguin')` branch
- Ensure existing custom logic is untouched

---

## Files You Need to Create/Modify

| File | Action | Complexity |
|------|--------|-----------|
| `kinguin.client.ts` | Create | Low |
| `kinguin-webhook.controller.ts` | Create | Low |
| `fulfillment.service.ts` | Modify (add dispatch) | Low |
| `product.entity.ts` | Modify (add sourceType) | Low |
| `products-form.tsx` | Modify (add sourceType UI) | Low |
| Database migration | Create | Low |
| `kinguin.client.spec.ts` | Create (tests) | Medium |

**Total New Code:** ~400 lines  
**Total Modified Code:** ~100 lines

---

## Timeline

| Phase | Time | By When |
|-------|------|---------|
| Step 1: Credentials | 30 mins | Today |
| Step 2: Test products | 1 hour | Tomorrow |
| Step 3: Client + Service | 6 hours | This week |
| Step 4: Webhook | 3 hours | This week |
| Step 5: Testing | 2 hours | This week |
| Step 6: Database + UI | 4 hours | Next week |
| **TOTAL** | **16-17 hours** | **Within 2 weeks** |

---

## Key Principles

1. **No breaking changes** - custom products always work
2. **Feature flag** - everything behind `KINGUIN_ENABLED`
3. **Gradual rollout** - test thoroughly before full launch
4. **Monitoring** - watch logs closely for errors
5. **Fallback plan** - can disable anytime

---

## Questions?

- Kinguin API docs: `kinguin-API-documentation.md`
- Your Phase 3 architecture: `01_LEVEL_2_PHASE3_PLAN.md`
- Detailed roadmap: `CUSTOM_PRODUCTS_NEXT_STEPS.md`
- Full checklist: `KINGUIN_INTEGRATION_CHECKLIST.md`

**You've got this!** 🚀
