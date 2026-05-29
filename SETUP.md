# 🚀 Setup Guide

This guide will walk you through setting up all the required services for your Next.js web application.

## 1. 📊 Database Setup (Supabase)

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New project"
   - Choose your organization and fill in project details

2. **Get your credentials**
   - Go to Settings → API
   - Copy your Project URL and anon public key
   - Copy your service role key (keep this secret!)

3. **Set environment variables**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
   ```

## 2. 🔐 Authentication Setup (Clerk)

1. **Create a Clerk application**
   - Go to [clerk.com](https://clerk.com)
   - Click "Add application"
   - Choose your authentication providers (Google, GitHub, etc.)

2. **Configure your application**
   - Add your domain: `http://localhost:3000` (development)
   - Add your production domain when ready

3. **Get your API keys**
   - Go to API Keys
   - Copy your publishable key and secret key

4. **Set up webhooks** (optional)
   - Go to Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
   - Select events: `user.created`, `user.updated`, `user.deleted`

5. **Set environment variables**
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key
   CLERK_SECRET_KEY=sk_test_your-secret-key
   CLERK_WEBHOOK_SECRET=whsec_your-webhook-secret
   ```

## 3. 💳 Payment Setup (Stripe)

1. **Create a Stripe account**
   - Go to [stripe.com](https://stripe.com)
   - Sign up and complete account setup

2. **Get your API keys**
   - Go to Developers → API keys
   - Copy your publishable key and secret key
   - For production, use live keys instead of test keys

3. **Set up webhooks**
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook signing secret

4. **Set environment variables**
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
   STRIPE_SECRET_KEY=sk_test_your-secret-key
   STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
   ```

## 4. 🚀 Deployment Setup (Vercel)

1. **Create a Vercel project**
   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub repository
   - Import your project

2. **Configure environment variables**
   - In your Vercel dashboard, go to Settings → Environment Variables
   - Add all your environment variables (copy from .env.local)
   - Make sure to check "Production", "Preview", and "Development" as appropriate

3. **Update your URLs**
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel domain
   - Update Clerk allowed domains to include your Vercel domain
   - Update Stripe webhook endpoints to your Vercel domain

## 5. 🗄️ Database Schema

1. **Push your schema to the database**
   ```bash
   npm run db:push
   ```

2. **Seed with sample data** (optional)
   ```bash
   npm run db:seed
   ```

3. **Set up Row Level Security** (recommended)
   - In your Supabase dashboard, go to Authentication → Policies
   - Create policies for your tables to secure user data

## 6. ✅ Testing Your Setup

1. **Test the application locally**
   ```bash
   npm run dev
   ```

2. **Test authentication**
   - Try signing up with a new account
   - Check that user data is created in your Supabase database

3. **Test API endpoints**
   - Visit `http://localhost:3000/api/hello`
   - Should return a JSON response

4. **Test database connection**
   - Check Drizzle Studio: `npm run db:studio`
   - Verify your tables are created

## 🛠️ Development Tips

### Environment Variables Checklist
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DATABASE_URL`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`

### Recommended Development Flow
1. Set up local environment first
2. Test all integrations locally
3. Deploy to Vercel preview branch
4. Test in preview environment
5. Merge to production

### Security Reminders
- Never commit `.env.local` or any environment files
- Keep service role keys and secret keys private
- Use test keys during development
- Enable Supabase RLS policies in production
- Validate webhook signatures in production

## 🆘 Need Help?

- **Next.js Issues**: [Next.js Documentation](https://nextjs.org/docs)
- **Supabase Issues**: [Supabase Documentation](https://supabase.com/docs)
- **Clerk Issues**: [Clerk Documentation](https://clerk.com/docs)
- **Stripe Issues**: [Stripe Documentation](https://stripe.com/docs)
- **Deployment Issues**: [Vercel Documentation](https://vercel.com/docs)