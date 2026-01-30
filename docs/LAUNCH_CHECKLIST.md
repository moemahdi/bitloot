# ✅ BitLoot Launch Day Checklist

**Quick Reference:** Use this checklist on launch day. For detailed instructions, see [LAUNCH_PREPARATION_GUIDE.md](./LAUNCH_PREPARATION_GUIDE.md)

---

## 🔴 Phase 1: Database Cleanup (1-2 hours)

- [ ] Backup sandbox database (optional)
- [ ] Run cleanup SQL script
- [ ] Verify all test data removed
- [ ] Keep only admin user

**Cleanup Command:**
```bash
docker exec -i bitloot-db psql -U bitloot bitloot < docs/cleanup_script.sql
```

---

## 🔴 Phase 2: Production APIs (2-3 hours)

### NOWPayments
- [ ] Get production API key from [dashboard](https://account.nowpayments.io/)
- [ ] Get IPN secret key
- [ ] Set IPN callback URL: `https://api.yourdomain.com/webhooks/nowpayments/ipn`
- [ ] Update `.env`: `NOWPAYMENTS_BASE=https://api.nowpayments.io/v1`
- [ ] Test API connection

### Kinguin
- [ ] Get production API key from [dashboard](https://www.kinguin.net/integration/dashboard)
- [ ] Configure webhook URL
- [ ] Get webhook secret
- [ ] Update `.env`: `KINGUIN_BASE_URL=https://gateway.kinguin.net/esa/api`
- [ ] Test API connection

### Resend
- [ ] Verify production domain
- [ ] Configure DNS (SPF, DKIM, DMARC)
- [ ] Update `EMAIL_FROM` to production domain

### Security
- [ ] Generate new `JWT_SECRET` (64 chars)
- [ ] Generate new `REFRESH_TOKEN_SECRET` (64 chars)
- [ ] Update `CORS_ORIGIN` to production domain

---

## 🔴 Phase 3: Product Catalog (4-8 hours)

- [ ] Create pricing rules (global 15% margin)
- [ ] Add 10-15 AAA games
- [ ] Add 5-10 indie games
- [ ] Add 6-10 gift cards
- [ ] Set competitive prices
- [ ] Publish all products
- [ ] Verify products appear on frontend

---

## 🟡 Phase 4: Frontend Polish (4-8 hours)

### User Pages
- [ ] Homepage - all 12 sections work
- [ ] Catalog - search, filters, pagination
- [ ] Product detail - images, price, add to cart
- [ ] Cart - quantities, promo codes, totals
- [ ] Checkout - email, CAPTCHA, payment redirect
- [ ] Order status - timeline, key reveal
- [ ] Profile - orders, watchlist, settings

### Mobile Responsive
- [ ] Test at 375px (iPhone SE)
- [ ] Test at 768px (iPad)
- [ ] Test at 1024px (laptop)

### Common Issues
- [ ] No broken images
- [ ] No console errors
- [ ] No layout shift
- [ ] Loading states work
- [ ] Error states work

---

## 🟡 Phase 5: Admin Review (2-3 hours)

- [ ] Dashboard stats load
- [ ] Orders management works
- [ ] Payments list works
- [ ] Products CRUD works
- [ ] Pricing rules work
- [ ] Kinguin sync works
- [ ] Promos management works
- [ ] Webhooks viewer works
- [ ] Audit logs work
- [ ] Feature flags work

---

## 🔴 Phase 6: Security Check (2-4 hours)

- [ ] JWT expiry verified (15m/7d)
- [ ] OTP rate limiting works
- [ ] Admin routes protected
- [ ] HMAC verification enabled
- [ ] Keys encrypted
- [ ] Signed URLs expire
- [ ] No secrets in frontend code
- [ ] CORS configured correctly

---

## 🔴 Phase 7: Final Testing (4-8 hours)

### Test Scenario 1: Guest Checkout
1. [ ] Browse catalog
2. [ ] Add to cart
3. [ ] Checkout with email
4. [ ] Complete CAPTCHA
5. [ ] Payment redirect works
6. [ ] (Pay small real amount)
7. [ ] Order confirmed
8. [ ] Keys delivered
9. [ ] Email received

### Test Scenario 2: Admin Flow
1. [ ] Login as admin
2. [ ] View dashboard
3. [ ] Check orders
4. [ ] Update product
5. [ ] Export data

---

## 🔴 Phase 8: Deployment (2-4 hours)

### Pre-Deploy
- [ ] All quality checks pass: `npm run quality:full`
- [ ] Build succeeds: `npm run build`
- [ ] SDK generated: `npm run sdk:dev`

### Deploy
- [ ] Run migrations: `npm --workspace apps/api run migration:run`
- [ ] Deploy API to hosting
- [ ] Deploy Web to hosting
- [ ] Configure DNS
- [ ] Update webhook URLs in NOWPayments/Kinguin

### Verify
- [ ] Homepage loads
- [ ] Catalog shows products
- [ ] Cart works
- [ ] Admin accessible
- [ ] Webhooks receiving

---

## 🚀 Go Live!

Once all boxes checked:
1. Announce launch
2. Monitor first orders closely
3. Check webhook logs for issues
4. Be available for quick fixes

---

## 📊 Post-Launch Daily Checks

- [ ] Order count normal
- [ ] Payment success rate >95%
- [ ] Fulfillment rate 100%
- [ ] No failed webhooks
- [ ] Kinguin balance sufficient
- [ ] No error alerts

---

## 🆘 Emergency Contacts

| Service | Dashboard | Support |
|---------|-----------|---------|
| NOWPayments | [account.nowpayments.io](https://account.nowpayments.io) | support@nowpayments.io |
| Kinguin | [kinguin.net/integration](https://www.kinguin.net/integration) | integration@kinguin.net |
| Resend | [resend.com](https://resend.com) | support@resend.com |
| Cloudflare | [dash.cloudflare.com](https://dash.cloudflare.com) | - |

---

**Remember:** Take your time, test thoroughly, and don't rush the launch! 🎮
