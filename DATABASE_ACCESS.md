# Database Access Guide

## Your Neon PostgreSQL Connection

**Connection String:**
```
postgresql://neondb_owner:npg_oqWzmPaL0l5B@ep-spring-sea-advthgqh-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## Option 1: Prisma Studio (Visual Interface)

**View and edit your database with a GUI:**

```bash
npx prisma studio
```

This will open a browser at `http://localhost:5555` where you can:
- View all tables and data
- Add, edit, or delete records
- Search and filter data

---

## Option 2: Reset Database (Clear All Data)

**To completely reset your database and start fresh:**

```bash
npx prisma migrate reset
```

This will:
1. Delete all data
2. Drop all tables
3. Re-run all migrations
4. Regenerate Prisma Client

**⚠️ Warning:** This deletes EVERYTHING in your database permanently!

---

## Option 3: Database Client (Advanced)

You can also connect using any PostgreSQL client like:
- **TablePlus** (https://tableplus.com)
- **DBeaver** (https://dbeaver.io)
- **pgAdmin** (https://www.pgadmin.org)

Use the connection string above.

---

## Quick Commands

```bash
# View database with Prisma Studio
npx prisma studio

# Reset database (deletes all data)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration after schema changes
npx prisma migrate dev --name your_migration_name
```

---

## Neon Dashboard

You can also manage your database at:
**https://console.neon.tech**

From there you can:
- View connection details
- Monitor usage
- Run SQL queries
- Manage backups
