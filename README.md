# AahaFoods

Premium homemade Indian food storefront built with Next.js App Router, Tailwind CSS, Framer Motion, and a static/serverless deployment model for Vercel.

## Highlights

- Premium mobile-first storefront with cinematic homepage sections
- Supabase-backed product source with static fallback data
- `/admin` workspace for product, order, inventory, customer, media, and visitor management
- Supabase Auth login for admin access
- Supabase Storage uploads for product images and videos
- LocalStorage cart with WhatsApp and Razorpay checkout flows
- Visitor event logging for lightweight analytics
- SEO metadata, sitemap, and robots configuration

## Stack

- Next.js App Router
- Tailwind CSS
- Framer Motion
- next-themes
- Supabase JS client

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://aahafood.com
NEXT_PUBLIC_WHATSAPP_NUMBER=917760776000
NEXT_PUBLIC_RAZORPAY_LINK=https://rzp.io/l/your-payment-link
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL in [supabase/admin-setup.sql](/Users/ashok/Documents/aahafood/aahafood/supabase/admin-setup.sql).
3. In Supabase Authentication, create your admin user email/password.
4. Add the env vars above locally and in Vercel.

### What The SQL Creates

- `products` table for the live catalog, images, videos, featured flags, and inventory
- `orders` table for checkout submissions and order statuses
- `visitor_events` table for lightweight traffic tracking
- `product-media` storage bucket for image/video uploads
- RLS policies that allow:
  - Public product reads for active products
  - Public order inserts
  - Public visitor event inserts
  - Authenticated admin management for products, orders, visitors, and storage

## Admin Login

The admin area lives at `/admin`.

- There is no default hardcoded password in the repo.
- Login uses Supabase Auth email/password.
- Only users you create in Supabase Authentication should be treated as admins.

## Admin Features

- Dashboard with revenue, orders, visitors, and stock alerts
- Product management: add, edit, delete, feature, activate/deactivate
- Media management: upload images/videos and attach them to products
- Order management: review orders and update status
- Inventory management: adjust stock counts and thresholds
- User management: customer directory derived from order history
- Visitor management: recent page views, device mix, and top pages

## Checkout Notes

- WhatsApp and Razorpay checkout stay backend-light and Vercel-friendly.
- Orders are still resilient if Supabase is unavailable.
- Replace `NEXT_PUBLIC_RAZORPAY_LINK` with your live hosted payment link before launch.

## Deployment To Vercel

1. Push the repo to GitHub.
2. Import it into Vercel as a Next.js project.
3. Add the environment variables.
4. Redeploy after Supabase setup.

If Supabase is configured, the storefront reads live products from the database. If not, it falls back to the bundled starter catalog.
