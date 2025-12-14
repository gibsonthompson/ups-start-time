# UPS Start Time App

A simple PWA for viewing and managing warehouse shift start times with SMS notifications via GoHighLevel.

## Features

- 📱 **PWA** - Install as mobile app (Add to Home Screen)
- 📦 **Worker Dashboard** - View upcoming shift times
- 🔄 **Real-time Updates** - Dashboard auto-refreshes when admin changes times
- 📲 **SMS Notifications** - Workers get texted when times change (via GoHighLevel)
- 👨‍💼 **Admin Panel** - Edit shift times and send custom announcements

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Supabase Table

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  start_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial shifts (example for next week)
INSERT INTO shifts (date, day_of_week, start_time) VALUES
  ('2025-12-15', 'Sunday', '03:00:00'),
  ('2025-12-16', 'Monday', '03:00:00'),
  ('2025-12-17', 'Tuesday', '03:00:00'),
  ('2025-12-18', 'Wednesday', '03:00:00'),
  ('2025-12-19', 'Thursday', '03:00:00'),
  ('2025-12-20', 'Friday', '03:00:00'),
  ('2025-12-21', 'Saturday', '03:00:00');
```

**Enable Row Level Security (optional):**
```sql
-- Enable RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read shifts
CREATE POLICY "Allow public read access" ON shifts
  FOR SELECT USING (true);

-- Only allow authenticated updates (you can customize this)
CREATE POLICY "Allow authenticated updates" ON shifts
  FOR UPDATE USING (true);
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:

```env
# Supabase (from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# GoHighLevel
GHL_WORKFLOW_WEBHOOK_URL=https://services.leadconnectorhq.com/hooks/...

# Admin Password (set to whatever you want)
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password
```

### 4. Set Up GoHighLevel Workflow

1. **Create a Workflow** in GHL:
   - Name: "UPS Start Time Notification"
   - Trigger: **Webhook**
   - Copy the webhook URL and paste into `.env.local`

2. **Add Action - Send SMS:**
   - Send to: **All contacts with tag** → `ups-workers`
   - Message: `{{webhook.message}}`

3. **Create Worker Opt-in Form** (optional):
   - Fields: Name, Phone Number
   - On submit: 
     - Tag contact with `ups-workers`
     - Send welcome SMS with app link

### 5. Create PWA Icons

Generate app icons in two sizes:
- `public/icon-192.png` (192x192px)
- `public/icon-512.png` (512x512px)

**Quick icon generation:**
- Use [favicon.io](https://favicon.io) or [realfavicongenerator.net](https://realfavicongenerator.net)
- Upload a simple logo or emoji (📦 works great!)
- Download and place in `/public` folder

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel dashboard.

**Don't forget to add environment variables in Vercel:**
- Go to Project Settings → Environment Variables
- Add all variables from `.env.local`

## Usage

### Worker View
- Visit: `https://your-app.vercel.app`
- Add to Home Screen (mobile)
- View upcoming shift times
- Dashboard auto-updates when admin changes times

### Admin Panel
- Visit: `https://your-app.vercel.app/admin`
- Enter password
- Edit shift times (workers get SMS notification)
- Send custom announcements

## Tech Stack

- **Frontend:** Next.js 14 + Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **SMS:** GoHighLevel
- **Hosting:** Vercel
- **Real-time:** Supabase Realtime

## File Structure

```
ups-start-time/
├── app/
│   ├── page.jsx              # Worker dashboard
│   ├── admin/
│   │   └── page.jsx          # Admin panel
│   ├── api/
│   │   └── notify-ghl/
│   │       └── route.js      # SMS notification API
│   ├── layout.jsx            # Root layout with PWA config
│   └── globals.css           # Tailwind CSS
├── lib/
│   └── supabase.js           # Supabase client
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── icon-192.png          # App icon (small)
│   └── icon-512.png          # App icon (large)
└── package.json
```

## Troubleshooting

**Shifts not loading?**
- Check Supabase connection in browser console
- Verify environment variables are set
- Check RLS policies in Supabase

**SMS not sending?**
- Verify GHL webhook URL is correct
- Check GHL workflow is active
- Ensure workers are tagged with `ups-workers`
- Check browser console for API errors

**Real-time updates not working?**
- Supabase requires Realtime to be enabled on the table
- Go to Supabase → Database → Replication
- Enable realtime for `shifts` table

## Support

Built with ❤️ for warehouse workers who just want to know their start times.
