# Account Recovery SOP (Lost Email Access)

**Last Updated:** January 10, 2026

---

## When to Use

User has lost access to their email and cannot receive OTP codes to log in.

---

## Recovery Flow

1. **User contacts support** via support@bitloot.io or live chat
2. **Verify identity** (require 2-3 of the following):
   - Recent order ID(s)
   - Product names from order history
   - Approximate order date(s)
   - Crypto transaction hash from a payment
   - Account creation date (rough)
3. **24-hour cooling period** before making changes
4. **Admin updates email** in database via admin panel
5. **Notifications sent** to both old and new email addresses
6. **User logs in** with new email + OTP

---

## Verification Checklist

| Check | Required |
|-------|----------|
| At least 2 pieces of verifiable info | ✅ |
| 24-hour waiting period observed | ✅ |
| Old email notified (if possible) | ✅ |
| Audit log entry created | ✅ |

---

## Security Notes

- **One recovery per account per 30 days**
- **Always notify old email** even if user claims it's inaccessible
- **Log everything**: who, when, what verification was provided
- **Trust but verify**: if anything feels off, escalate

---

## User-Facing Message Template

> To recover your account, please provide:
> - Your current email (the one you can't access)
> - Your new email address
> - At least 2 of: recent order ID, product name purchased, payment transaction hash, or account creation date
>
> For security, account recovery takes 24-48 hours to complete.
