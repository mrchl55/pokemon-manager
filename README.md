# Pokemon Manager (Quick Start)

A Next.js application for managing a Pokemon collection, utilizing Prisma, NextAuth.js, and Material UI. Pokemon details are enhanced with data from the public PokeAPI.

## 1. Prerequisites

*   **Node.js**: v18+ recommended.
*   **Package Manager**: npm (or yarn/pnpm).
*   **Database**: PostgreSQL server running.

## 2. Initial Setup

```bash


npm install
```

## 3. Environment Configuration

Create a `.env` file in the project root with the following:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_SECRET="your_generated_strong_secret"
NEXTAUTH_URL="http://localhost:3000"
```
*   Update `DATABASE_URL` with your PostgreSQL connection details.
*   Generate a `NEXTAUTH_SECRET` (e.g., `openssl rand -base64 32`).

## 4. Database Setup

Apply database migrations to set up the schema:

```bash
npx prisma migrate dev
```

## 5. Seed Database (Optional)

To populate the database with initial data (if a seed script is configured in `prisma/schema.prisma`):

```bash
npx prisma db seed
```

## 6. Run the Application

```bash
npm run dev
```
*   Application will be available at: [http://localhost:3000](http://localhost:3000)
*   You can register a new user or use any seeded credentials.

## Core Technologies

*   **Framework/Backend**: Next.js (App Router), Prisma (ORM)
*   **Authentication**: NextAuth.js
*   **Frontend**: React, Material UI, React Query
*   **Language**: TypeScript
*   **External Data**: [PokeAPI](https://pokeapi.co/) (for supplementary Pokemon data)

## Key Features & Notes

*   User registration and login.
*   Pokemon CRUD (Create, Read, Update, Delete) with image uploads.
*   Pokemon list with pagination, sorting, and filtering.
*   Detailed Pokemon view combining local and PokeAPI data.
*   Ensure your PostgreSQL server is running and `DATABASE_URL` is correctly set.
*   Uploaded images are stored in `public/uploads/pokemon/`. 