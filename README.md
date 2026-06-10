# Klassens Tallrikar

![Klassens Tallrikar Landing Page](public/landing-page.png)

A full-stack web application built for schools and classes to easily organize, manage, and vote on class superlatives/awards (e.g., "Class Clown", "Most Likely to Succeed").

## Features

- **Class Creation**: Create a dedicated workspace for your class with a unique URL (`/klass/[slug]`) and an admin password.
- **Admin Management**: Easily add students, define award categories, and manage nicknames.
- **Interactive Voting**: A smooth, step-by-step voting interface for students with progress tracking.
- **Real-time Dashboard**: An admin dashboard featuring pie charts to visualize voting results in real time.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Convex](https://www.convex.dev/)
- **Animations & Charts**: [Framer Motion](https://www.framer.com/motion/) (Custom SVG charts)

## Project Structure

- `convex/`: Backend logic, database schema (`schema.ts`), and CRUD mutations/queries for classes, students, awards, and votes.
- `src/app/`: Next.js frontend pages and routing.
    - `klass/[slug]/`: Main class hub.
    - `klass/[slug]/rosta/`: The student voting interface.
    - `klass/[slug]/dashboard/`: Admin results dashboard.
- `src/components/`: Reusable React components (e.g., `VotePieChart`, `ProgressBar`, `CreateClassForm`).
- `src/lib/`: Utility functions.

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the Convex backend (this will prompt you to log in and set up a Convex project):
   ```bash
   npx convex dev
   ```

3. In a separate terminal, start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

This application is deployed on a self-hosted Ubuntu server managed via **Dokploy** with preview deployments enabled.

### Dokploy Setup (Preview Deployments)

To set up this project in Dokploy with build-on-server for preview deployments:

1. **Create a New Compose Project**: In the Dokploy dashboard, create a new Compose project.
2. **Repository Configuration**: Link the project to your GitHub repository and branch.
3. **Enable Previews**: Enable preview deployments (Dokploy will automatically spin up deployments for each pull request).
4. **Environment Variables & Build Args**:
   Configure the following environment variables in Dokploy. Since Next.js builds are static/standalone, these variables must also be configured as **Build Arguments** in the application settings so they are inlined during build time:
   - `NEXT_PUBLIC_CONVEX_URL`: Your Convex deployment URL (e.g., `https://your-app.convex.cloud/`)
   - `NEXT_PUBLIC_CONVEX_SITE_URL`: Your Convex site URL (e.g., `https://your-app.convex.site/`)
5. **Deploy**: Dokploy will clone the repository, build the Docker image on the server using the `Dockerfile`, and expose the service via Traefik.

### Example Docker Compose Template

Below is an example `docker-compose.yml` template for Dokploy. 

> [!NOTE]
> The actual `docker-compose.yml` is kept in `.gitignore` and is not committed to the repository.

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
        - NEXT_PUBLIC_CONVEX_SITE_URL=${NEXT_PUBLIC_CONVEX_SITE_URL}
    container_name: klassens-web-preview
    restart: always
    environment:
      - PORT=3000
      - NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
      - NEXT_PUBLIC_CONVEX_SITE_URL=${NEXT_PUBLIC_CONVEX_SITE_URL}
```
