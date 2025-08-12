> DEPRECADO: Migrado a Supabase Auth. Mantener solo como referencia histórica.

# Clerk Setup Instructions

## Problem
Current Clerk app has custom domain `clerk.adioswifi.es` configured that cannot be removed and is causing CORS/404 errors.

## Solution: Create New Clerk App

### Step 1: Create New Clerk Application
1. Go to https://dashboard.clerk.com
2. Click "Add application"
3. Name: "NotiFly Production"
4. **DO NOT configure custom domain**
5. Copy the new keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### Step 2: Update Vercel Environment Variables
1. Go to Vercel project settings
2. Update environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = new publishable key
   - `CLERK_SECRET_KEY` = new secret key

### Step 3: Configure Clerk Settings
In the new Clerk app dashboard:
- Set redirect URLs to your domain
- Configure sign-in/sign-up pages
- Set session settings as needed

### Step 4: Test
- Deploy and test authentication
- Verify no CORS errors
- Confirm all flows work

## Expected Result
- ✅ No CORS errors
- ✅ No 404 errors on Clerk assets
- ✅ Authentication works perfectly
- ✅ Uses official Clerk CDNs
