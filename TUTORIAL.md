# Construction Workforce Platform - Complete Tutorial

## Overview

This is a full-stack application connecting construction job owners, workers, and brokers. You've got a complete working application with authentication, job postings, applications, and messaging.

## Technology Stack

### Backend
- **Express.js**: Web server framework
- **Prisma**: Database ORM (Object-Relational Mapping)
- **SQLite**: Database (file-based, easy to use)
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing for security
- **Zod**: Input validation

### Frontend
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool

## Project Structure

```
project/
├── server/                    # Backend API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema definition
│   │   └── migrations/       # Database migration files
│   ├── src/
│   │   ├── index.ts          # Server entry point
│   │   ├── lib/
│   │   │   └── prisma.ts     # Database client
│   │   ├── middleware/
│   │   │   └── auth.ts       # Authentication middleware
│   │   └── routes/
│   │       ├── index.ts      # Routes aggregator
│   │       └── modules/      # Individual route files
│   │           ├── auth.ts   # Login/Register
│   │           ├── jobs.ts   # Job CRUD
│   │           ├── applications.ts
│   │           └── messages.ts
│   └── package.json
│
└── web/                       # Frontend React app
    ├── src/
    │   ├── App.tsx           # Main app component
    │   ├── main.tsx          # Entry point
    │   ├── contexts/
    │   │   └── AuthContext.tsx  # Authentication state
    │   ├── components/
    │   │   ├── AuthForms.tsx    # Login/Register forms
    │   │   ├── Dashboard.tsx    # Main dashboard
    │   │   ├── JobsList.tsx     # Job listings
    │   │   ├── CreateJob.tsx    # Job creation form
    │   │   └── JobDetails.tsx   # Job details with apps & messages
    │   └── lib/
    │       ├── api.ts        # API fetch helper
    │       └── auth.ts       # Auth headers helper
    └── package.json
```

## How to Run the Application

### 1. Start the Backend

```bash
cd server
npm install                    # Install dependencies
npm run prisma:generate       # Generate Prisma client
npm run prisma:migrate        # Run database migrations
npm run prisma:seed           # Add sample data
npm run dev                   # Start server on port 4000
```

### 2. Start the Frontend

```bash
cd web
npm install                    # Install dependencies
npm run dev                   # Start dev server on port 5173
```

### 3. Access the Application

Open http://localhost:5173 in your browser.

**Test Accounts** (created by seed script):
- Owner: `owner@example.com` / `password123`
- Worker: `worker@example.com` / `password123`
- Broker: `broker@example.com` / `password123`

## Key Concepts Explained

### 1. Authentication Flow

**How it works:**
1. User submits email/password
2. Backend verifies credentials
3. Backend creates a JWT (JSON Web Token) containing user info
4. Frontend stores token in localStorage
5. Frontend includes token in all API requests
6. Backend verifies token before processing requests

**Files involved:**
- `server/src/routes/modules/auth.ts` - Login/Register endpoints
- `server/src/middleware/auth.ts` - Token verification
- `web/src/contexts/AuthContext.tsx` - Manages user state
- `web/src/lib/auth.ts` - Adds auth headers to requests

### 2. Database Schema

The database has 5 main tables:

**Users** - People using the platform
- Stores email, password (hashed), name, role
- Role can be: OWNER, WORKER, or BROKER

**Jobs** - Job postings
- Created by OWNER users
- Has title, description, location, category, budget
- Status: OPEN, IN_PROGRESS, COMPLETED, CANCELLED

**Applications** - Worker applications to jobs
- Links a WORKER to a JOB
- Has optional cover note
- Status: PENDING, ACCEPTED, REJECTED, WITHDRAWN

**Brokerage** - Broker assignments
- Links a BROKER to a JOB
- Owner assigns broker to manage the job
- Has fee percentage

**Messages** - Job discussions
- Anyone involved in a job can send messages
- Used for communication between owners, workers, brokers

### 3. React Context for State Management

**What is Context?**
Context is React's way to share data across components without passing props through every level.

**AuthContext** (`web/src/contexts/AuthContext.tsx`):
- Stores current user information
- Provides login/register/logout functions
- Makes user data available to all components
- Persists authentication across page refreshes

**How to use it:**
```typescript
const { user, login, logout } = useAuth();

if (user) {
  // User is logged in
  console.log(user.email, user.role);
}
```

### 4. Component Structure

**App.tsx** - Root component
- Wraps everything in AuthProvider
- Shows login/register forms OR dashboard based on auth state

**Dashboard.tsx** - Main app interface
- Shows after login
- Manages view state (list/create/details)
- Includes header with user info and logout button

**JobsList.tsx** - Displays all jobs
- Fetches jobs from API
- Shows job cards with details
- Clicking a job opens JobDetails

**CreateJob.tsx** - Form to post new job
- Only shown to OWNER users
- Validates input
- Submits to backend API

**JobDetails.tsx** - Shows job information
- Three tabs: Details, Applications, Messages
- Workers can apply to jobs
- Owners see applications
- Everyone can message about the job

### 5. API Communication

**API Helper** (`web/src/lib/api.ts`):
```typescript
// Makes HTTP requests easier
const data = await api('/jobs', {
  method: 'POST',
  headers: authHeaders(),
  body: JSON.stringify({ title: 'My Job' })
});
```

**How it works:**
1. Frontend calls `api()` function
2. Adds Content-Type and Authorization headers
3. Sends request to backend
4. Handles errors
5. Returns JSON response

### 6. Backend Routes

**Route Pattern:**
```typescript
router.get('/jobs', async (req, res) => {
  // Get jobs from database
  const jobs = await prisma.job.findMany();
  // Send back as JSON
  res.json({ items: jobs });
});
```

**Authentication Middleware:**
```typescript
// requireAuth checks if user is logged in
router.post('/jobs', requireAuth, async (req, res) => {
  // req.user is available here
  const job = await prisma.job.create({
    data: { ...req.body, ownerId: req.user.id }
  });
  res.json(job);
});
```

## Common Operations

### Adding a New Feature

Example: Add a "favorites" feature for workers to save jobs

1. **Update Database Schema** (`server/prisma/schema.prisma`):
```prisma
model Favorite {
  id        String   @id @default(cuid())
  jobId     String
  workerId  String
  createdAt DateTime @default(now())

  job    Job  @relation(fields: [jobId], references: [id])
  worker User @relation(fields: [workerId], references: [id])
}
```

2. **Run Migration**:
```bash
cd server
npm run prisma:migrate
```

3. **Create Backend Route** (`server/src/routes/modules/favorites.ts`):
```typescript
import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const { jobId } = req.body;
  const favorite = await prisma.favorite.create({
    data: { jobId, workerId: req.user!.id }
  });
  res.json(favorite);
});

export default router;
```

4. **Register Route** (`server/src/routes/index.ts`):
```typescript
import favoritesRouter from './modules/favorites';
router.use('/favorites', favoritesRouter);
```

5. **Create Frontend Component** (`web/src/components/FavoriteButton.tsx`):
```typescript
import { useState } from 'react';
import { api } from '../lib/api';
import { authHeaders } from '../lib/auth';

export function FavoriteButton({ jobId }: { jobId: string }) {
  const [isFavorited, setIsFavorited] = useState(false);

  async function toggleFavorite() {
    await api('/favorites', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ jobId })
    });
    setIsFavorited(true);
  }

  return (
    <button onClick={toggleFavorite}>
      {isFavorited ? '★' : '☆'} Favorite
    </button>
  );
}
```

## Debugging Tips

### Backend Issues

**Check server logs:**
The terminal running `npm run dev` shows all API requests and errors.

**Test API directly:**
```bash
# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"worker@example.com","password":"password123"}'
```

**Check database:**
```bash
cd server
npx prisma studio  # Opens database browser
```

### Frontend Issues

**Check browser console:**
Press F12 in browser to see errors and API responses.

**Check Network tab:**
See all API requests, their payloads, and responses.

**Check localStorage:**
In console: `localStorage.getItem('token')`

## Security Notes

### What's Already Implemented

1. **Password Hashing**: Passwords stored with bcrypt
2. **JWT Authentication**: Secure tokens with expiration
3. **Authorization**: Role-based access control
4. **Input Validation**: Zod schemas validate all inputs

### Important Security Rules

1. **Never commit secrets**: `.env` files should not be in git
2. **Validate user input**: Always validate on backend
3. **Check authorization**: Verify user has permission before actions
4. **Use HTTPS in production**: Encrypt data in transit

## Next Steps

### Features to Add

1. **Broker Management**: Let owners assign brokers to jobs
2. **Application Status**: Let owners accept/reject applications
3. **User Profiles**: Add more user information and avatars
4. **Search & Filter**: Search jobs by category/location
5. **Notifications**: Email or in-app notifications
6. **File Uploads**: Upload resumes, project photos
7. **Ratings & Reviews**: Rate workers/owners after job completion

### Improvements

1. **Better Error Handling**: Show user-friendly error messages
2. **Loading States**: Better loading indicators
3. **Responsive Design**: Improve mobile experience
4. **Testing**: Add unit and integration tests
5. **Deployment**: Deploy to cloud platform

## Learning Resources

### For Beginners

- **JavaScript**: https://javascript.info/
- **React**: https://react.dev/learn
- **TypeScript**: https://www.typescriptlang.org/docs/handbook/intro.html

### For This Project

- **Express.js**: https://expressjs.com/
- **Prisma**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## Common Questions

**Q: Where is the database file?**
A: `server/prisma/dev.db` (SQLite file)

**Q: How do I reset the database?**
A: Delete `dev.db` and run `npm run prisma:migrate` again

**Q: How do I add a new page?**
A: Add a new view state in Dashboard.tsx and create the component

**Q: Why use TypeScript?**
A: It catches errors before runtime and makes code easier to understand

**Q: Can I use a different database?**
A: Yes! Prisma supports PostgreSQL, MySQL, SQL Server, etc. Just change the datasource in schema.prisma

**Q: How do I deploy this?**
A: Backend → Heroku, Render, Railway. Frontend → Vercel, Netlify. Database → PostgreSQL on cloud.

## Troubleshooting

### "Port already in use"
Kill the process using that port:
```bash
# On Mac/Linux
lsof -ti:4000 | xargs kill -9

# On Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### "Module not found"
Install dependencies:
```bash
npm install
```

### "Database error"
Reset database:
```bash
cd server
rm prisma/dev.db
npm run prisma:migrate
npm run prisma:seed
```

### Build errors
Clear and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Summary

You now have a complete full-stack application! Here's what you've built:

✅ User authentication with JWT
✅ Three user roles (Owner, Worker, Broker)
✅ Job posting and listing
✅ Worker applications to jobs
✅ Job-specific messaging
✅ Role-based UI and permissions
✅ Clean, modern interface with Tailwind CSS
✅ Type-safe code with TypeScript

The code is organized, follows best practices, and is ready to be extended with new features. Good luck with your learning journey!
