## End-to-End Review: Custom Products Feature

### Overall Assessment: **Solid implementation (8.5/10)**

The feature is well-architected, follows BitLoot's patterns, and covers the critical paths. The hybrid dispatcher model, encryption layer, inventory lifecycle, and structured delivery content are all well-implemented. Below are the issues and enhancements I found, ranked by severity.

---

### **CRITICAL ISSUES (Must Fix)**

#### 1. Multi-Quantity Custom Items: Only 1 Inventory Item Reserved Per Order Item

In fulfillment.service.ts, `fulfillCustomItem()` calls `reserveItem()` once per `OrderItem`, but an `OrderItem` can have `quantity > 1`. The current code only reserves **one** inventory item regardless of quantity.

```typescript
// Current: reserves only 1 item, ignoring quantity
const inventoryItem = await this.inventoryService.reserveItem(item.productId, orderId);
```

**Fix needed:** Loop `item.quantity` times, reserve multiple items, build aggregated delivery content, and upload all keys to R2 as a single delivery JSON.

#### 2. `sortBy` SQL Injection Vector

In admin-inventory.service.ts, `sortBy` is interpolated directly into a query builder without validation:

```typescript
const sortBy = query.sortBy ?? 'uploadedAt';
qb.orderBy(`item.${sortBy}`, sortDir);
```

While the DTO has `@IsOptional() @IsString()`, there's no `@IsIn()` or enum restriction, meaning a crafted `sortBy` value could alter the query.

**Fix:** Add `@IsIn(['uploadedAt', 'soldAt', 'expiresAt', 'cost'])` validation to the DTO, or whitelist in the service.

#### 3. Bulk Import Runs Sequential DB Queries Inside Transaction

In admin-inventory.service.ts, the bulk import loop runs a duplicate check query (`findOne`) + save **per item** within a transaction. For 1000 items, this is 2000+ queries in a single transaction, risking timeouts and lock contention.

**Fix:** Batch the hash-check with `IN` clause, use `insert().values([...]).orIgnore()` for bulk inserts, then count results.

---

### **HIGH ISSUES (Should Fix)**

#### 4. No Inventory Check Before Checkout

The checkout flow doesn't verify `stockAvailable > 0` for custom products before creating the order. A customer can place an order for an out-of-stock product, payment goes through, then fulfillment fails.

**Fix:** Add a stock availability check in the order creation flow. Either reserve inventory at order creation or at least validate stock > 0.

#### 5. `reserveItem` Doesn't Handle Multiple Items Per Product in Same Order

If an order contains 3x of the same product, `reserveItem()` is called 3 times sequentially. Each call acquires a pessimistic lock, finds the oldest available item, and reserves it. This is safe but slow — each call waits for the lock from the previous call's transaction.

**Fix:** Add a `reserveItems(productId, orderId, quantity)` method that reserves N items in a single transaction.

#### 6. Stock Count Can Go Negative

If `stockAvailable` is 0 and a `decrement` is called (e.g., in `deleteItem` or `updateStatus`), TypeORM doesn't prevent negative values. This would silently set stock to -1.

**Fix:** Use `UPDATE products SET "stockAvailable" = GREATEST("stockAvailable" - 1, 0)` or add a `CHECK (stockAvailable >= 0)` constraint.

#### 7. `hiddenFields` Initial State in KeyReveal Is Wrong

In KeyReveal.tsx, sensitive fields start **visible** because `hiddenFields` starts empty. The toggle logic uses `hiddenFields.has(fieldId)` to determine if shown — so sensitive fields like passwords are shown immediately.

**Fix:** Initialize `hiddenFields` with all sensitive field IDs on mount, so sensitive fields start masked.

#### 8. Missing Error Toast in AddItemDialog

In page.tsx, `handleSubmit` in `AddItemDialog` awaits `addItemMutation.mutateAsync()` but has no `.catch()` or error handling. A failed mutation silently fails.

**Fix:** Wrap in try/catch with a toast notification for errors.

---

### **MEDIUM ISSUES (Improvements)**

#### 9. `faceValue` Type Mismatch

In product-delivery.types.ts, `DeliveryContent.faceValue` is typed as `number`, but the `code` item type stores it as `value: number`. In `buildDeliveryContent`, the `faceValue` property on `baseContent` is never set for code items — only the label mentions the face value.

**Fix:** Set `baseContent.faceValue = itemData.value` and `baseContent.currency = itemData.currency` in the `code` case for proper display in the frontend.

#### 10. `releaseStaleReservations` Sets `reservedAt` to `undefined`

In admin-inventory.service.ts, releasing a reservation sets `reservedAt: undefined` and `reservedForOrderId: undefined`. TypeORM may interpret `undefined` differently from `null` depending on version. Should explicitly use `null` for database NULL.

#### 11. Account Bulk Import: Fragile Parsing

In page.tsx, account bulk import uses auto-detection of `:` vs `,` separator. If a password contains `:` or `,`, the parsing will break. There's no support for quoted fields.

**Fix:** Support JSON-per-line for accounts too, or use a proper CSV parser, or at minimum document the limitation.

#### 12. No "Restore to Available" Option in Inventory Table UI

In the dropdown menu (page.tsx), items with status `invalid` or `expired` can only be deleted — there's no UI option to restore them to `available`. The backend supports it (`updateStatus` accepts `available`), but the frontend only shows the option for `available` → `invalid`.

**Fix:** Add a "Restore to Available" dropdown option for `invalid` and `expired` items.

#### 13. No Loading/Error State for `handleMarkInvalid`

page.tsx calls `updateStatusMutation.mutateAsync()` without try/catch or toast feedback.

#### 14. StockSyncService Cron Comment Mismatch

In stock-sync.service.ts, the comment says "Runs every hour at minute 5" but the decorator is `@Cron(CronExpression.EVERY_HOUR)`. Similarly, stock count sync comment says "every 15 minutes" but uses `EVERY_30_MINUTES`.

---

### **LOW ISSUES (Nice-to-Haves)**

#### 15. Delivery Content for Code Items Missing `faceValue`/`currency` on `baseContent`

The `buildDeliveryContent` method doesn't populate `baseContent.faceValue` and `baseContent.currency` for `code` type items. The label includes the face value text, but the `StructuredDeliveryContent` component checks `content.faceValue` separately and would show nothing.

#### 16. No Bulk Delete in UI

The admin can only delete items one at a time. For large inventories being cleaned up, this is tedious.

#### 17. Bundle Type Bulk Import Not Supported

The bulk import for `bundle` and `custom` types expects JSON-per-line, which is error-prone for admin users. No CSV format supported.

#### 18. No Export Functionality

The admin cannot export inventory items to CSV/JSON for backup or analysis.

---

### **ARCHITECTURE & SECURITY: Well Done**

- AES-256-GCM encryption with unique IVs per item
- SHA-256 duplicate detection
- Pessimistic locking on inventory reservation (prevents race conditions)
- Transaction-wrapped stock count updates
- Audit logging on all mutations
- SDK-first frontend with proper typed hooks
- Structured delivery content with sensitive field masking
- Idempotent fulfillment (already-fulfilled check)
- Legacy R2 fallback for backward compatibility
- Proper separation: types, DTOs, entity, service, controller

---

### **BRAINSTORMED ENHANCEMENTS FOR ROBUSTNESS**

| Enhancement | Impact |
|---|---|
| **Pre-checkout stock check** | Prevents orders for out-of-stock custom products |
| **Batch reserve method** | Performance for multi-quantity orders |
| **Inventory reservation at payment initiation** | Guarantees stock during payment window |
| **Restore-to-available UI** | Admin can recover invalid/expired items |
| **Batch operations (bulk delete/mark invalid)** | Admin efficiency |
| **CSV export** | Backup & analytics |
| **Error toasts on all mutations** | UX polish |
| **Key format regex validation** | Catch common data entry mistakes (Steam key pattern, etc.) |
| **Replacement item delivery** | When customer reports invalid, admin can trigger replacement from inventory |
| **Supplier tracking analytics** | See per-supplier invalid rates |

---