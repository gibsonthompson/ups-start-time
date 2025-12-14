# Quick Setup Guide

## Immediate Next Steps

### 1. Set Up Environment Variables

Create `.env.local` in the root directory:

```env
# Your Supabase credentials (from https://supabase.com/dashboard/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Your GHL workflow webhook URL (create workflow first - see step 2)
GHL_WORKFLOW_WEBHOOK_URL=https://services.leadconnectorhq.com/hooks/xxxxx

# Set your admin password (anything you want)
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
```

### 2. Set Up GoHighLevel Workflow

**In your GHL account:**

1. Go to **Automations** → **Workflows**
2. Click **Create Workflow**
3. Name it: "UPS Start Time Notification"
4. **Set Trigger:**
   - Select "Webhook"
   - Copy the webhook URL
   - Paste it in your `.env.local` as `GHL_WORKFLOW_WEBHOOK_URL`

5. **Add Action - Send Message:**
   - Click "+" to add action
   - Select "Send Message" → "SMS"
   - **Send to:** Select "All contacts with tag" → type `ups-workers`
   - **Message:** In the message box, click "Custom Values" and select `{{webhook.message}}`
   - Save the action

6. **Publish the workflow** (make sure it's active)

### 3. Add Test Workers to GHL

**Option A: Manual (for testing)**
1. Go to **Contacts** in GHL
2. Add a contact with your phone number
3. Tag it with `ups-workers`

**Option B: Create Opt-in Form (for production)**
1. Create a form with Name + Phone fields
2. On submit: Tag contact with `ups-workers`
3. Share form link with workers

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the App

```bash
npm run dev
```

Visit:
- Worker dashboard: http://localhost:3000
- Admin panel: http://localhost:3000/admin

### 6. Test It Out

1. Go to admin panel (password is whatever you set in `.env.local`)
2. Edit a shift time
3. You should receive an SMS (if you tagged yourself in GHL)
4. Worker dashboard should auto-update

### 7. Create App Icons (Optional for now)

For PWA install functionality, add these to `/public`:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)

Use https://favicon.io to generate from emoji 📦

### 8. Deploy to Vercel

```bash
npx vercel
```

Or connect GitHub repo in Vercel dashboard.

**Add environment variables in Vercel:**
- Go to Project Settings → Environment Variables
- Add the same vars from `.env.local`

---

## Common Issues

**"Shifts not loading"**
- Check browser console for errors
- Verify Supabase URL and keys are correct
- Make sure you created the `shifts` table in Supabase

**"SMS not sending"**
- Verify GHL webhook URL is correct (check for typos)
- Make sure GHL workflow is **published/active**
- Confirm contact is tagged with `ups-workers`
- Check Network tab in browser dev tools for API call

**"Real-time updates not working"**
- Enable Realtime in Supabase:
  - Database → Replication → Enable for `shifts` table

---

## You're Done! 🎉

Workers can now:
- Bookmark the app URL
- Add to home screen (mobile)
- Check start times anytime
- Get SMS when times change
