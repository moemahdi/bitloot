# Account Deletion Feature

**Status:** ✅ Complete  
**Date:** January 10, 2026

## Overview

Users can request account deletion with a 30-day grace period. During this period, they can cancel the deletion via the profile page or email link.

## User Flow

```
Request Deletion → 30-day grace period → Auto soft-delete (cron)
       ↓
   Can cancel anytime via:
   • Profile page button
   • Email link (no login required)
```

## API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /auth/account/delete/request` | JWT | Request account deletion |
| `POST /auth/account/delete/cancel` | JWT | Cancel deletion (authenticated) |
| `GET /auth/account/delete/cancel-token` | JWT | Get token for redirect to cancel page |
| `GET /auth/account/delete/cancel/:token` | Public | Cancel via email link (no login) |
| `GET /auth/account/delete/status` | JWT | Get deletion status |
| `POST /admin/ops/user-deletion-cleanup` | Admin | Manual trigger for cleanup job |

## Database

**Users table:**
- `deletionRequestedAt` (timestamptz, nullable) - When deletion was requested
- `deletedAt` (timestamptz, nullable) - Soft delete timestamp

## Cron Job

**File:** `apps/api/src/jobs/user-deletion-cleanup.processor.ts`

- Runs daily at **2:00 AM**
- Finds users where `deletionRequestedAt + 30 days < now`
- Sends "Account deleted" confirmation email
- Sets `deletedAt` timestamp (soft delete)

## Frontend Pages

| Page | Description |
|------|-------------|
| `/profile` (Security tab) | Shows deletion warning with cancel button |
| `/cancel-deletion/[token]` | Public page for cancellation via email link |

## Key Implementation Details

1. **Token System**: HMAC-SHA256 signed tokens for secure email links
2. **Soft Delete**: TypeORM `softDelete()` sets `deletedAt`, user can't log in
3. **Cache Invalidation**: Profile page refetches status after cancellation
4. **Double-execution Prevention**: React 18 Strict Mode handled with `useRef`

## Deleted User Login Attempt

When a user tries to login after their account has been deleted (30+ days):

**UI Message:**
> "This account has been deleted. Please contact support if you believe this is an error."

The system checks for soft-deleted users via `isEmailDeleted()` before allowing OTP requests.

## Files Modified/Created

### Backend
- `apps/api/src/modules/auth/auth.controller.ts` - All deletion endpoints
- `apps/api/src/modules/auth/user.service.ts` - Deletion/cancellation logic
- `apps/api/src/jobs/user-deletion-cleanup.processor.ts` - Cron job (NEW)
- `apps/api/src/database/entities/user.entity.ts` - Added `deletionRequestedAt`

### Frontend
- `apps/web/src/app/(dashboard)/profile/page.tsx` - Deletion UI in Security tab
- `apps/web/src/app/cancel-deletion/[token]/page.tsx` - Public cancel page (NEW)
