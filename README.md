# Wagerloo

A platform for University of Waterloo students to create professional profiles and receive community feedback on their expected co-op salary through a voting-based prediction system.

## Overview

Wagerloo allows students to showcase their skills, experience, and resumes while other students vote on whether they believe the predicted co-op salary is over or under the current market consensus. The voting mechanism creates a dynamic salary prediction that adjusts based on community input, providing students with data-driven insights into their market value.

## Core Features

- **Profile System**: Students create profiles with biographical information, profile pictures, and resume uploads
- **Over/Under Voting**: Community members vote on whether predicted salaries are over or under valued
- **Dynamic Line Movement**: Salary predictions adjust automatically based on voting patterns using a multi-round voting algorithm
- **Leaderboard**: Rankings of top profiles based on community consensus
- **Email Verification**: Secure authentication with email verification workflow

## Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS** for styling
- **shadcn/ui** component library

### Backend & Infrastructure
- **Next.js API Routes**
- **NextAuth v5** for authentication
- **Prisma ORM** for database management
- **PostgreSQL** database
- **Brevo** for transactional emails
- **Vercel** for deployment

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- npm or yarn package manager

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Email service (Brevo)
BREVO_API_KEY="your-brevo-api-key"
EMAIL_FROM="noreply@yourdomain.com"
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma db push
npx prisma generate
```

3. (Optional) Seed the database with sample data:
```bash
npm run seed
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database Schema

The application uses the following primary data models:

- **User**: Authentication and account management
- **Profile**: Student profiles including name, picture, and resume
- **Market**: Voting markets for each profile with salary predictions
- **Vote**: Individual votes cast by users (over/under)

## Project Structure

```
wagerloo-app/
├── app/
│   ├── api/              # API routes for voting, markets, profiles
│   ├── auth/             # Authentication pages (signin, register, verify)
│   ├── market/           # Individual market pages
│   ├── profile/          # Profile creation and editing
│   ├── leaderboard/      # Rankings page
│   └── page.tsx          # Main browse interface
├── components/
│   ├── ui/               # Reusable UI components
│   ├── navbar.tsx        # Navigation component
│   └── profile-guard.tsx # Profile requirement check
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   └── prisma.ts         # Prisma client singleton
└── prisma/
    ├── schema.prisma     # Database schema
    ├── seed.ts           # Database seeding scripts
    └── cleanup.ts        # Database maintenance utilities
```

## How It Works

1. **Profile Creation**: Users register with their email, verify their account, and create a profile with their information
2. **Market Generation**: Each profile automatically gets a market with an initial salary prediction
3. **Voting**: Other users browse profiles and vote "over" or "under" on the predicted salary
4. **Line Movement**: The prediction adjusts after each vote based on the voting distribution
5. **Leaderboard**: Profiles are ranked based on their final predicted salaries and voting activity

## Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run seed              # Seed with sample data
npm run cleanup          # Clean up database

# Prisma commands
npx prisma studio        # Open database GUI
npx prisma db push       # Push schema changes
```

## Deployment

The application is configured for deployment on Vercel. Ensure all environment variables are set in your Vercel project settings before deploying.

## License

MIT
