# AahaFoods

Premium homemade Indian food storefront built with Next.js App Router, Tailwind CSS, Framer Motion, Razorpay Standard Checkout, and a Vercel-friendly serverless backend.

## Highlights

- Premium mobile-first storefront with cinematic homepage sections
- Supabase-backed product source with static fallback data
- `/admin` workspace for role-based category, content, product, order, inventory, customer, media, and visitor management
- Supabase Auth login for admin access
- Supabase `admin_users` role checks for protected admin operations
- Supabase Storage uploads for product images and videos
- Editable homepage hero videos and testimonials
- LocalStorage cart with WhatsApp ordering and server-verified Razorpay payments
- Serverless order intake with optional Supabase storage plus email and WhatsApp notifications
- Storefront sold-out states based on live inventory
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
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_xxxxx
ORDER_NOTIFICATION_EMAIL_TO=orders@yourdomain.com
ORDER_NOTIFICATION_EMAIL_FROM=AahaFood Orders <orders@yourdomain.com>
META_WHATSAPP_ACCESS_TOKEN=your-meta-whatsapp-token
META_WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
ORDER_NOTIFICATION_WHATSAPP_TO=91XXXXXXXXXX
```

An example file lives at [.env.example](/Users/ashok/Documents/aahafood/aahafood/.env.example).

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL in [supabase/admin-setup.sql](/Users/ashok/Documents/aahafood/aahafood/supabase/admin-setup.sql).
3. In Supabase Authentication, create your admin user email/password.
4. Add your auth user to `admin_users` with a row like:

```sql
insert into public.admin_users (user_id, email, role)
values ('YOUR_AUTH_USER_ID', 'you@example.com', 'owner')
on conflict (user_id) do update
set email = excluded.email,
    role = excluded.role,
    is_active = true;
```

5. Add the env vars above locally and in Vercel.

### What The SQL Creates

- `admin_users` table for real admin-role checks
- `categories` table for storefront sections, gradients, descriptions, and display order
- `site_content` table for homepage hero videos and testimonials
- `products` table for the live catalog, images, videos, featured flags, and inventory
- `orders` table for checkout submissions, payment ids, payment status, and order statuses
- `visitor_events` table for lightweight traffic tracking
- `product-media` storage bucket for image/video uploads
- RLS policies that allow:
  - Public category and product reads for active records
  - Public homepage content reads
  - Public order inserts
  - Public visitor event inserts
  - Admin-only management for categories, content, products, orders, visitors, admin users, and storage

## Admin Login

The admin area lives at `/admin`.

- There is no default hardcoded password in the repo.
- Login uses Supabase Auth email/password.
- Real admin access is granted only after the authenticated user is added to `admin_users`.

## Admin Features

- Dashboard with revenue, orders, visitors, and stock alerts
- Category management: add, edit, delete, reorder, activate/deactivate
- Content management: update homepage hero videos and testimonials
- Product management: add, edit, delete, feature, activate/deactivate
- Media management: upload images/videos and attach them to products
- Order management: review orders and update status
- Inventory management: adjust stock counts and thresholds
- User management: customer directory derived from order history
- Visitor management: recent page views, device mix, and top pages

## Checkout Notes

- Razorpay now uses a real server-created order via `POST /api/razorpay/order`.
- Payment success is confirmed only after `POST /api/razorpay/verify` validates the HMAC signature.
- Orders can be stored in Supabase with `pending` and `paid` payment states.
- Inventory is reduced only after successful payment verification.
- WhatsApp checkout still works as a manual ordering fallback.

## Toast Notifications

- Global toast provider is mounted in [app/layout.tsx](/Users/ashok/Documents/aahafood/aahafood/app/layout.tsx).
- Use the hook from [hooks/use-toast.ts](/Users/ashok/Documents/aahafood/aahafood/hooks/use-toast.ts) inside any client component.
- Variants available: `success`, `error`, `warning`, `info`.

```tsx
"use client";

import { useToast } from "@/hooks/use-toast";

export function ExampleButton() {
  const toast = useToast();

  return (
    <button
      type="button"
      onClick={() =>
        toast.success({
          title: "Added to cart",
          description: "Your pantry pick is ready for checkout.",
        })
      }
    >
      Add
    </button>
  );
}
```

The current storefront already uses this system for cart updates, checkout validation, Razorpay payment states, checkout success/failure pages, and admin sign-in feedback.

## Razorpay Flow

### Server Routes

- `POST /api/razorpay/order`
  - Validates the request body.
  - Recalculates subtotal, shipping, and total on the server.
  - Creates a Razorpay order in paise.
  - Returns `orderId`, `amount`, `currency`, `keyId`, and an internal `orderReference`.
- `POST /api/razorpay/verify`
  - Verifies the Razorpay signature with HMAC SHA256.
  - Fetches the payment from Razorpay to confirm order id and amount.
  - Marks the order paid in Supabase if configured.
  - Reduces inventory only after verification succeeds.

### Frontend Routes

- `/checkout`
- `/checkout/success`
- `/checkout/failed`

## Why The Old Frontend-Only Razorpay Flow Failed

The broken flow relied on a client-side payment link instead of a server-created Razorpay order. That causes three common problems:

- the amount can drift from the real cart total because the browser is composing the payment request
- the checkout has no trustworthy server-side order reference to verify against
- the app often navigates away as soon as the hosted link returns or the callback falls through, which is why users end up back on the home page

With the new flow, the browser opens Razorpay only after the server has created a signed order, and the app redirects to success or failure pages only after explicit verification results.

## Common Mistakes That Cause Redirect To Home Page

- using a payment link instead of a Razorpay order created from your backend
- letting the pay button behave like a form submit instead of `type="button"`
- pushing the router before signature verification completes
- relying on `callback_url` without handling close, fail, and retry states in the app
- trusting the frontend subtotal instead of recalculating it on the server
- reducing stock or clearing the cart before payment verification succeeds

## How To Test Locally And On Vercel

### Local

1. Copy [.env.example](/Users/ashok/Documents/aahafood/aahafood/.env.example) to `.env.local`.
2. Add Razorpay test keys from your Razorpay dashboard.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `/checkout`, fill customer details, and pay with Razorpay test mode.
6. Confirm that successful payments land on `/checkout/success`.
7. Confirm that cancelling the modal lands on `/checkout/failed`.

### Vercel

1. Push the repo to GitHub.
2. Import it into Vercel as a Next.js project.
3. Add every environment variable from `.env.local`.
4. If you use Supabase, rerun [supabase/admin-setup.sql](/Users/ashok/Documents/aahafood/aahafood/supabase/admin-setup.sql).
5. Redeploy.
6. Test one complete payment using Razorpay test mode on the deployed preview or production URL.

## Vercel Deployment Instructions

1. In Razorpay Dashboard, keep the account in Test Mode first.
2. In Vercel Project Settings, add:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - optional Supabase variables
3. Set `NEXT_PUBLIC_SITE_URL` to your production domain.
4. Redeploy after environment variables are saved.
5. Verify the checkout on the deployed domain, not just localhost.

## Razorpay Test Mode Instructions

Use Razorpay Test Mode from the Dashboard and pay with any of the official Razorpay test instruments. A common test card setup is:

- Card number: `4111 1111 1111 1111`
- Expiry: any future date
- CVV: any 3 digits
- Name: any value
- OTP: `123456`

You can also use Razorpay UPI and netbanking test methods from the checkout sandbox options in Test Mode.

## Checklist For Switching From Test Mode To Live Mode

- replace test keys with live keys in Vercel and local env files
- confirm the same key id is set in both `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_ID`
- keep `RAZORPAY_KEY_SECRET` server-only
- verify payment capture settings in Razorpay Dashboard
- test one low-value live payment end to end
- confirm `/checkout/success` shows after a real live payment
- confirm Supabase records include `payment_status = paid`
- confirm email and WhatsApp notifications still arrive

## Deployment To Vercel

1. Push the repo to GitHub.
2. Import it into Vercel as a Next.js project.
3. Add the environment variables.
4. Redeploy after Supabase setup.

If Supabase is configured, the storefront reads live categories, homepage content, and products from the database. If not, it falls back to the bundled starter content.

If you previously ran an older version of the SQL setup, rerun [supabase/admin-setup.sql](/Users/ashok/Documents/aahafood/aahafood/supabase/admin-setup.sql) to create the new `admin_users` and `site_content` tables and refresh the latest policies.
