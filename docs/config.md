# Configuring API Providers for Different Environments
## How Environment Switching Works:

1. **Sandbox Tab** (Orange dot) - Currently active for development
   - Fill with sandbox/test API keys
   - Test connections work with sandbox APIs
   
2. **Production Tab** (Red dot) - For live deployment
   - Fill with production API keys
   - Different API endpoints auto-configured

3. **Switching Environments**:
   - Click the **Production** tab header
   - This switches the **active environment** for that provider
   - Now all API calls will use production credentials

## What You Should Do:

1. **Stay on Sandbox** for local development
2. **Click Production tab** for each provider
3. **Fill in production values** (they're stored separately from sandbox)
4. **Don't switch to Production mode yet** - just save the credentials
5. When you deploy to your production server, change `NODE_ENV=production` and the system will auto-use production credentials

**Important:** The "Test Connection" button tests the **currently active environment**. So if you're on Sandbox tab and test, it uses sandbox credentials. Switch to Production tab first if you want to test production credentials.

Is the Production tab showing empty fields for each provider? If so, it's working correctly - just fill them in!