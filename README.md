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

This application is self-hosted on a home Ubuntu server (`ryder@basement-server` at `192.168.4.69`) using **Dokploy** and exposed via **Cloudflare Tunnels** routing to Traefik.

The deployment consists of two services in a single Dokploy project called **"Klassens"**:
1. **Infrastructure Service**: A persistent docker-compose setup containing PostgreSQL, Convex Production (connected to PostgreSQL), and Convex Preview (running standalone with SQLite).
2. **Web Service**: The Next.js frontend, deployed as a Dokploy Application Service that builds on-server using the Dockerfile.

---

### Step-by-Step Dokploy Instructions

#### Step 1: Set up the Dokploy Project & Infrastructure
1. In Dokploy, create a new Project named **Klassens**.
2. Within the "Klassens" project, add a new **Compose** service named **Infrastructure**.
3. In the service settings, paste the contents of `infra/docker-compose.example.yml` (copy to `infra/docker-compose.yml` first and fill in the details).
4. Configure the service **Environment Variables**:
   - `POSTGRES_USER`: Choose a secure database user (e.g. `convex`).
   - `POSTGRES_PASSWORD`: Choose a strong password.
5. Turn **Preview Deployments** **OFF** for this Infrastructure service.
6. Click **Deploy** and verify all three containers (`klassens-db`, `klassens-convex-prod`, and `klassens-convex-preview`) are running and healthy.

#### Step 2: Generate Convex Admin Keys
Once the infrastructure containers are healthy, you need to generate admin keys to deploy functions to them.
1. Access the terminal of your server or use Dokploy's container console to run:
   ```bash
   # Generate admin key for Production
   docker exec -it klassens-convex-prod ./generate_admin_key.sh
   
   # Generate admin key for Preview
   docker exec -it klassens-convex-preview ./generate_admin_key.sh
   ```
2. Save the generated keys (they will start with `01...`). You will need these in later steps.

#### Step 3: Configure Domains and Cloudflare Tunnels
Since we are using Cloudflare free tier, we must use flat subdomains (`*.ezryder.us`) to stay within Universal SSL coverage:
1. In the **Infrastructure** Compose settings in Dokploy, add the following Domains:
   - For `convex-prod` on port `3210`: `klassens-convex.ezryder.us`
   - For `convex-preview` on port `3210`: `klassens-convex-preview.ezryder.us`
2. Update your Cloudflare Tunnel configuration (e.g., on SWE-NAS) to route traffic for:
   - `klassens-convex.ezryder.us` → `http://192.168.4.69:80` (or your Traefik port)
   - `klassens-convex-preview.ezryder.us` → `http://192.168.4.69:80`

#### Step 4: Configure the Web Service
1. Within the "Klassens" project in Dokploy, add a new **Application** service named **Web**.
2. Link this service to your GitHub repository and point to the `main` branch.
3. In the Web service **Build Settings**:
   - Set **Build Type** to `Dockerfile`.
   - Set **Dockerfile Path** to `Dockerfile`.
   - Set **Docker Build Stage (Target)** to `runner`.
4. In the Web service **General Settings**:
   - Set **Target Port** to `3000`.
5. Configure the **Environment Variables** in the Web service settings (both production and preview variables must be defined here, as Dokploy does not support separate environment variable sets for previews):
   - **Production variables**:
     - `CONVEX_URL` = `https://klassens-convex.ezryder.us`
     - `CONVEX_SELF_HOSTED_URL` = `https://klassens-convex.ezryder.us`
     - `CONVEX_SELF_HOSTED_ADMIN_KEY` = `<your-production-admin-key>`
   - **Preview variables** (these will override production values in preview containers):
     - `CONVEX_URL_PREVIEW` = `https://klassens-convex-preview.ezryder.us`
     - `CONVEX_SELF_HOSTED_URL_PREVIEW` = `https://klassens-convex-preview.ezryder.us`
     - `CONVEX_SELF_HOSTED_ADMIN_KEY_PREVIEW` = `<your-preview-admin-key>`
6. Set up the **Domain** in the Web service settings:
   - Add your domain `klassens.ezryder.us` pointing to target port `3000`.
7. Enable **Preview Deployments** on the Web service settings.
8. Configure the Github webhook in Dokploy so that pushing to `main` automatically triggers a build and deploy on-server, and pull requests trigger preview deployments.

Now, whenever you push to `main` (or trigger a manual deploy in Dokploy), Dokploy will pull the latest code and build the container locally on-server using the `runner` target in the `Dockerfile`. During startup, the container's entrypoint script (`scripts/entrypoint.sh`) checks for the presence of the `DOKPLOY_DEPLOY_URL` variable (injected by Dokploy for preview deployments). If it exists, it swaps the active database and backend endpoints to the preview versions before deploying Convex functions and launching the Next.js app!

---

### Example Docker Compose Templates

#### 1. Infrastructure Compose (`infra/docker-compose.example.yml`)
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: klassens-db
    restart: always
    volumes:
      - /mnt/data/klassens-convex-db:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=placeholder_user
      - POSTGRES_PASSWORD=placeholder_password
      - POSTGRES_DB=convex_self_hosted
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}"]
      interval: 5s
      timeout: 3s
      retries: 10

  convex-prod:
    image: ghcr.io/get-convex/convex-backend:latest
    container_name: klassens-convex-prod
    restart: always
    stop_grace_period: 10s
    stop_signal: SIGINT
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - /mnt/data/klassens-convex-data:/convex/data
    environment:
      - POSTGRES_URL=postgresql://placeholder_user:placeholder_password@postgres:5432
      - DO_NOT_REQUIRE_SSL=true
      - DISABLE_BEACON=true
    healthcheck:
      test: ["CMD", "curl", "-sf", "http://localhost:3210/version"]
      interval: 5s
      timeout: 3s
      retries: 15

  convex-preview:
    image: ghcr.io/get-convex/convex-backend:latest
    container_name: klassens-convex-preview
    restart: always
    stop_grace_period: 10s
    stop_signal: SIGINT
    volumes:
      - /mnt/data/klassens-convex-preview-data:/convex/data
    environment:
      - DISABLE_BEACON=true
    healthcheck:
      test: ["CMD", "curl", "-sf", "http://localhost:3210/version"]
      interval: 5s
      timeout: 3s
      retries: 15
```


