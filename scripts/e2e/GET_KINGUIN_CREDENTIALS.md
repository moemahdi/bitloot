# 🔑 Getting Your Kinguin API Key

**Status:** ✅ **QUICK GUIDE**  
**Time:** 2 minutes  
**Goal:** Find and save your API Key for sandbox testing  
**Date:** November 10, 2025

---

## ✅ Good News: You Only Need ONE Credential

```
API Key (from Integration Dashboard) ← You have/need THIS ✅
    =
Everything you need for sandbox testing! 🎉
```

**You can authenticate to Kinguin sandbox API with just the API key.**

No separate Client ID + Client Secret needed for sandbox and developer testing.

---

## 📍 Step-by-Step: Get Your API Key

### Step 1: Login to Kinguin Integration Dashboard

```bash
# Open browser and go to:
https://www.kinguin.net/integration/dashboard

# Login with your Kinguin account credentials
```

### Step 2: Navigate to API Settings

```
Menu Path:
Dashboard
  → Settings (or Integration Settings)
    → API Keys
```

### Step 3: Copy Your API Key

```
API Keys Section:
┌────────────────────────────────────────┐
│ API Key (Sandbox):                     │
│ your_api_key_here_abc123xyz789...  ← COPY THIS
│                                        │
│ Environment: Sandbox                   │
│ Status: Active                         │
│ Last Used: Just now                    │
└────────────────────────────────────────┘

✅ Copy the API key
✅ Store safely (don't commit to git)
✅ Use this for all sandbox testing
```

### Step 4 (Optional): Get Webhook Secret

```
If you need webhook verification:

Webhooks Section:
┌────────────────────────────────────────┐
│ Webhook Secret:                        │
│ webhook_secret_xyz789...           ← Optional for testing
│                                        │
│ Status: Enabled                        │
│ Endpoint: (configure as needed)        │
└────────────────────────────────────────┘

For local testing, you can simulate webhooks
without needing the secret configured.
```

---

## 🛡️ Security Best Practices

### DO NOT:
```bash
❌ DO NOT: Commit to git
❌ DO NOT: Share in messages
❌ DO NOT: Store in code files
❌ DO NOT: Put in README
❌ DO NOT: Hardcode in scripts
```

### DO:
```bash
✅ DO: Store in .env file
✅ DO: Use environment variables
✅ DO: Add .env to .gitignore
✅ DO: Keep in password manager
✅ DO: Regenerate if leaked
```

---

## 📝 Store Credential Safely

### Option 1: Create .env File (Recommended)

```bash
# Create .env file in repository root
cat > .env << 'EOF'
# Kinguin Integration Dashboard Credentials
KINGUIN_API_KEY="your_api_key_here"
KINGUIN_BASE_URL="https://sandbox.kinguin.net/api/v1"

# Optional: Webhook secret for IPN verification
KINGUIN_WEBHOOK_SECRET="your_webhook_secret_here"

# Ensure .env is in .gitignore
EOF

# Make sure .env is ignored
echo ".env" >> .gitignore
```

### Option 2: Export in Terminal Session

```bash
# Set temporarily for testing (expires when terminal closes)
export KINGUIN_API_KEY="your_api_key_here"
export KINGUIN_BASE_URL="https://sandbox.kinguin.net/api/v1"

# Verify set
echo $KINGUIN_API_KEY
echo $KINGUIN_BASE_URL
```

### Option 3: Use Password Manager

```bash
# Store in 1Password, Bitwarden, LastPass, etc.
# Then copy into .env or export in terminal
```

---

## ✅ Verify You Have Everything

```bash
# Check if API key is set
echo "API Key: ${KINGUIN_API_KEY:0:20}..." # Shows first 20 chars
echo "Base URL: ${KINGUIN_BASE_URL:-NOT SET}"

# Expected output (if all set):
# API Key: your_api_key_here_...
# Base URL: https://sandbox.kinguin.net/api/v1
```

---

## 🧪 Test API Connection

Once you have the API key:

```bash
# Set your API key
export KINGUIN_API_KEY="your_api_key_here"
export KINGUIN_BASE_URL="https://sandbox.kinguin.net/api/v1"

# Test API connection (get offers)
curl -s -X GET "${KINGUIN_BASE_URL}/offers?page=1&limit=5" \
  -H "Authorization: Bearer ${KINGUIN_API_KEY}" | jq '.'

# If you see offers data, you're good! ✅
# Example response:
# {
#   "statusCode": 200,
#   "data": [
#     {
#       "id": "1234567",
#       "name": "Some Product",
#       "price": 9.99,
#       ...
#     }
#   ]
# }
```

---

## 🆘 Troubleshooting

### Problem: "Unauthorized" or "401 Invalid API Key"

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Solution:**
- Verify API key is correct (copy from Kinguin dashboard again)
- Ensure NO extra spaces before/after
- Check you're using the **Sandbox** API key (not Production)
- Verify API key hasn't expired in dashboard
- Check Authorization header format: `Authorization: Bearer YOUR_KEY`

### Problem: "I don't see offers"

```json
{
  "statusCode": 400,
  "message": "Bad Request"
}
```

**Solution:**
- Check API key is correctly formatted
- Verify you're using the correct sandbox URL
- Try with page=1 and limit=5 parameters
- Check if your Kinguin account has access to offers in sandbox

### Problem: "I lost my API Key"

**Solution:**
- Go back to Kinguin Integration Dashboard
- Go to Settings → API Keys
- Generate a new API key (old one becomes invalid)
- Update your .env file with new key
- Test with curl command above

### Problem: "CORS error in browser"

**Solution:**
- Don't call Kinguin API directly from frontend browser
- Always call through your **BitLoot backend** (apps/api)
- Backend makes the API call with your API key
- Frontend receives data from your backend
- This is the correct architecture!

---

## 📊 Kinguin Credentials Checklist

| Item | Status | Where to Find |
|------|--------|---------------|
| **API Key** | ✅ Get now | https://www.kinguin.net/integration/dashboard → Settings → API Keys |
| **Webhook Secret** | ✅ Optional | Same location, only needed for webhook IPN verification |
| **.env file** | ⏳ Create | Repository root, add to .gitignore |
| **Client ID/Secret** | ❌ Not needed | Not required for sandbox testing with API key |

---

## 🚀 Next Steps

1. **Get API Key** from Kinguin Integration Dashboard
2. **Create .env file** with API key
3. **Add .env to .gitignore** (don't commit!)
4. **Test connection** (run curl command above)
5. **Start testing** (see SANDBOX_TESTING_QUICK_START.md)

---

## 💡 Quick Reference

```bash
# Quick setup (copy-paste):

# 1. Set API key
export KINGUIN_API_KEY="your_api_key_from_dashboard"
export KINGUIN_BASE_URL="https://sandbox.kinguin.net/api/v1"

# 2. Test it works
curl -s -X GET "${KINGUIN_BASE_URL}/offers?page=1&limit=5" \
  -H "Authorization: Bearer ${KINGUIN_API_KEY}" | jq '.'

# 3. If you see data, you're ready! ✅
```

---

## 📚 What This Credential Gives You

With just the **API Key**, you can:

✅ Get offers from Kinguin catalog  
✅ Create reservations for testing  
✅ Check reservation status  
✅ Retrieve keys from completed reservations  
✅ Simulate webhooks locally  
✅ Test the entire E2E flow  

**No additional credentials needed for sandbox!**
