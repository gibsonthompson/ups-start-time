# 🚀 NEXT STEPS - Start Here!

## ✅ Checklist (Do in Order)

### Step 1: Download & Extract Project
- [ ] Download the `ups-start-time` folder
- [ ] Extract it to your projects directory
- [ ] Open terminal in that folder

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Get Supabase Credentials
1. [ ] Go to https://supabase.com/dashboard
2. [ ] Select your project (or create new one)
3. [ ] Go to **Settings** → **API**
4. [ ] Copy these values:
   - Project URL (starts with https://)
   - `anon` public key (starts with eyJhbGc...)
   - `service_role` secret key (starts with eyJhbGc...)

### Step 4: Create .env.local File
- [ ] Copy `.env.example` to `.env.local`
- [ ] Paste your Supabase credentials
- [ ] Set admin password (anything you want)
- [ ] Leave GHL_WORKFLOW_WEBHOOK_URL empty for now

**Your `.env.local` should look like:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
GHL_WORKFLOW_WEBHOOK_URL=
NEXT_PUBLIC_ADMIN_PASSWORD=yourpassword
```

### Step 5: You Already Created the Supabase Table ✅
- [x] Table created (you mentioned you did this)

**If you haven't, run this SQL in Supabase:**
```sql
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  start_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Step 6: Add Sample Data to Supabase
- [ ] Go to Supabase → Table Editor → `shifts`
- [ ] Click "Insert Row" and add upcoming shifts

**Or run this SQL:**
```sql
INSERT INTO shifts (date, day_of_week, start_time) VALUES
  ('2025-12-16', 'Monday', '03:00:00'),
  ('2025-12-17', 'Tuesday', '03:00:00'),
  ('2025-12-18', 'Wednesday', '03:00:00'),
  ('2025-12-19', 'Thursday', '03:00:00'),
  ('2025-12-20', 'Friday', '03:00:00');
```

### Step 7: Enable Supabase Realtime (Important!)
- [ ] Go to Supabase → **Database** → **Replication**
- [ ] Find `shifts` table
- [ ] Toggle **Enable** for Realtime
- [ ] This makes dashboards auto-update when admin changes times

### Step 8: Test the App Locally
```bash
npm run dev
```

- [ ] Open http://localhost:3000 (worker view)
- [ ] You should see your shifts
- [ ] Open http://localhost:3000/admin
- [ ] Login with your password
- [ ] Edit a shift time
- [ ] Worker page should auto-update!

### Step 9: Set Up GoHighLevel Workflow

**In GHL Dashboard:**

1. [ ] Go to **Automations** → **Workflows**
2. [ ] Click **Create Workflow**
3. [ ] Name: "UPS Start Time Notification"
4. [ ] **Add Trigger**: Select "Webhook"
5. [ ] **Copy the webhook URL** (looks like https://services.leadconnectorhq.com/hooks/...)
6. [ ] **Paste it in `.env.local`** as `GHL_WORKFLOW_WEBHOOK_URL`
7. [ ] **Add Action**: Click "+", select "Send Message" → "SMS"
8. [ ] **Configure SMS:**
   - Send to: "All contacts with tag" → type `ups-workers`
   - Message field: Click "Custom Values" → select `{{webhook.message}}`
9. [ ] **Save & Publish** the workflow (make sure it's active!)

### Step 10: Add Test Contact in GHL
- [ ] Go to **Contacts** → **Add Contact**
- [ ] Enter your phone number
- [ ] **Add tag**: `ups-workers`
- [ ] Save

### Step 11: Test SMS Notifications
- [ ] Restart your dev server: `npm run dev`
- [ ] Go to admin panel: http://localhost:3000/admin
- [ ] Change a shift time
- [ ] You should get an SMS! 📲

### Step 12: Deploy to Vercel
```bash
npm install -g vercel
vercel
```

**Or use Vercel Dashboard:**
- [ ] Push code to GitHub
- [ ] Connect repo in vercel.com
- [ ] Add environment variables (same as `.env.local`)
- [ ] Deploy!

### Step 13: Create PWA Icons (Optional)
- [ ] Go to https://favicon.io
- [ ] Upload 📦 emoji or logo
- [ ] Download PNG files
- [ ] Rename to `icon-192.png` and `icon-512.png`
- [ ] Put in `/public` folder

### Step 14: Share with Workers
- [ ] Send workers the URL: `https://your-app.vercel.app`
- [ ] Tell them to "Add to Home Screen" (mobile)
- [ ] Make sure they're tagged in GHL with `ups-workers`

---

## 🎯 Success Checklist

You're done when:
- ✅ Worker dashboard shows shifts
- ✅ Admin can edit times
- ✅ Dashboard auto-updates (no refresh needed)
- ✅ SMS notifications send when time changes
- ✅ App deployed to Vercel

---

## 🆘 Need Help?

**App not loading locally?**
→ Check `.env.local` has correct Supabase URL/keys

**SMS not sending?**
→ Check GHL webhook URL in `.env.local`
→ Verify workflow is published/active in GHL
→ Make sure contact has `ups-workers` tag

**Real-time not working?**
→ Enable Realtime for `shifts` table in Supabase

---

## 📂 Key Files

- `app/page.jsx` - Worker dashboard
- `app/admin/page.jsx` - Admin panel
- `app/api/notify-ghl/route.js` - SMS notification API
- `.env.local` - Your credentials (create this!)

---

**Estimated Time:** 30-45 minutes total
**Start with Step 1 and work your way down!**
