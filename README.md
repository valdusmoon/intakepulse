# Full-Stack Next.js Web App Template

A production-ready Next.js template with Supabase, Clerk authentication, Drizzle ORM, Tailwind CSS, and Stripe payments integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (via Supabase)

### Installation

1. **Clone or copy this template**
   ```bash
   cp -r valdus-web-app-template your-new-project
   cd your-new-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env.local` and configure:
   ```bash
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_ENABLE_AUTH=true
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
   
   # Stripe Payments
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # Database
   DATABASE_URL=your_database_url
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   npm run db:seed  # Optional: seed with dummy data
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API routes
│   │   └── hello/         # Example API endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Homepage
├── components/            # Reusable React components
│   ├── ui/               # Basic UI components
│   ├── ErrorBoundary.tsx # Error boundary component
│   └── Toast.tsx         # Toast notification
├── contexts/             # React Context providers
│   └── ToastContext.tsx  # Toast notification context
├── hooks/                # Custom React hooks
│   └── useToast.ts       # Toast hook
└── lib/                  # Utility libraries and configurations
    ├── auth/            # Authentication helpers
    ├── db/              # Database schema and queries
    │   ├── schema/      # Drizzle ORM schema definitions
    │   └── queries/     # Database query functions
    ├── env.ts           # Environment variable config
    ├── logger.ts        # Logging utility
    ├── stripe.ts        # Stripe configuration
    └── supabase.ts      # Supabase client
```

### Key Files

- **`src/app/layout.tsx`** - Root layout with providers (Clerk, Toast)
- **`src/lib/env.ts`** - Environment variable configuration and validation
- **`src/lib/db/index.ts`** - Database connection and setup
- **`src/lib/stripe.ts`** - Stripe payment processing
- **`src/lib/supabase.ts`** - Supabase client configuration
- **`drizzle.config.ts`** - Database schema migration configuration
- **`vercel.json`** - Vercel deployment configuration

## 🔧 Available Scripts

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run typecheck` - Run TypeScript type checking

### Database
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Apply database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:seed` - Seed database with dummy data

### Code Quality
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## 🛠 Tech Stack & Integrations

### Core Framework
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling

### Database & ORM
- **Supabase** - PostgreSQL database hosting with real-time features
- **Drizzle ORM** - Type-safe database ORM
- **Row Level Security (RLS)** - Database-level security policies

### Authentication
- **Clerk** - User authentication and management
  - Social logins (Google, GitHub, etc.)
  - User profiles and session management
  - Webhook integration for user sync

### Payments
- **Stripe** - Payment processing
  - Payment Intents API for secure transactions
  - Webhooks for payment status updates
  - Processing fee calculations

### Deployment & Infrastructure
- **Vercel** - Hosting and deployment
  - Automatic deployments from git
  - Serverless functions for API routes
  - Environment variable management

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Drizzle Studio** - Database management GUI

## 🗄️ Database Schema

The template includes a basic user schema:

- **`users`** - User profiles
  - `id` (UUID, Primary Key)
  - `email` (Text, Unique, Not Null)
  - `displayName` (Text, Nullable)
  - `createdAt` (Timestamp, Default Now)
  - `updatedAt` (Timestamp, Default Now)

Extend this schema by adding more tables in `src/lib/db/schema/`.

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Environment variable validation** - Secure configuration management
- **Webhook signature verification** - Secure external integrations
- **Authentication middleware** - Protected routes and API endpoints
- **Error boundaries** - Graceful error handling

## 🚀 Deployment

The application is configured for deployment on Vercel:

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - Automatic deployments on push to main branch

## 📝 Environment Setup

### Required Environment Variables

#### Public (safe for browser)
- `NEXT_PUBLIC_APP_URL` - Application URL
- `NEXT_PUBLIC_ENABLE_AUTH` - Enable/disable authentication
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

#### Server-only (never expose to browser)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_WEBHOOK_SECRET` - Clerk webhook secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `DATABASE_URL` - PostgreSQL connection string

## 🎨 Customization

### Updating App Name and Branding
1. Update `package.json` name field
2. Update metadata in `src/app/layout.tsx`
3. Update homepage content in `src/app/page.tsx`
4. Replace placeholder text throughout the application

### Adding New Database Tables
1. Create schema in `src/lib/db/schema/your-table.ts`
2. Export from `src/lib/db/schema/index.ts`
3. Create queries in `src/lib/db/queries/your-table.ts`
4. Generate and apply migrations: `npm run db:generate && npm run db:push`

### Adding New Pages
1. Create page in `src/app/your-page/page.tsx`
2. Add any required components in `src/components/`
3. Update navigation as needed

## 🐛 Troubleshooting

### Common Issues

1. **Database connection errors**
   - Verify `DATABASE_URL` and Supabase credentials
   - Check if database migrations are up to date: `npm run db:push`

2. **Authentication not working**
   - Ensure `NEXT_PUBLIC_ENABLE_AUTH=true`
   - Verify Clerk environment variables
   - Check Clerk dashboard for correct domain configuration

3. **Payment processing issues**
   - Verify Stripe environment variables
   - Check webhook endpoint configuration in Stripe dashboard
   - Ensure webhook signatures are correctly validated

4. **Build failures**
   - Run type checking: `npm run typecheck`
   - Check for ESLint errors: `npm run lint`
   - Verify all environment variables are set

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Vercel Documentation](https://vercel.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license information here]