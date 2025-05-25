# Pokemon Manager (Quick Start)

 Next.js, Prisma, NextAuth.js Pokemon app.

## Setup & Run

  **Environment (`.env` file in root)**
    ```env
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    NEXTAUTH_SECRET="your_strong_random_secret_here"
    NEXTAUTH_URL="http://localhost:3000"
    ```
    *   Replace `DATABASE_URL` with your PostgreSQL connection string.
    *   Generate `NEXTAUTH_SECRET` (e.g., `openssl rand -base64 32`).

  **Database Setup**
    ```bash
    npx prisma migrate dev # Apply migrations, create schema
    ```

 **Seed Database (Optional)**
    *   Check `prisma/schema.prisma` for seed script configuration.
    *   If configured, run: `npx prisma db seed`

 **Run Application**
    ```bash
    npm run dev
    ```
    *   App will be at: [http://localhost:3000](http://localhost:3000)
    *   Register a new user or use seeded credentials if any.

## Core Tech Stack

*   Next.js (App Router), TypeScript, Prisma, NextAuth.js
*   React Query, Material UI

*   Ensure PostgreSQL is running and `DATABASE_URL` is correct.
*   The app features CRUD for Pokemon, auth, filtering, sorting.
*   Uploaded images are stored in `public/uploads/pokemon/`. 