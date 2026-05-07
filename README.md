# 🚀 Ethara AI — Team Task Manager

A full-stack collaborative Team Task Management application where users can create projects, invite team members, assign tasks, and track progress with role-based access control.

Built as a simplified version of tools like **Trello** and **Asana**.

## 🖥️ Live Demo

- **Frontend**: [https://ethara-ai-team-task-manager-iota.vercel.app](https://ethara-ai-team-task-manager-iota.vercel.app)
- **Backend API**: [https://ethara-ai-team-task-manager.onrender.com](https://ethara-ai-team-task-manager.onrender.com)
- **API Docs (Swagger)**: [https://ethara-ai-team-task-manager.onrender.com/api/docs](https://ethara-ai-team-task-manager.onrender.com/api/docs)

**Demo Credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `password123` |
| Member | `member@example.com` | `password123` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS, React Query, Recharts |
| **Backend** | NestJS, Prisma ORM, PostgreSQL |
| **Auth** | JWT (JSON Web Tokens) |
| **Validation** | class-validator, class-transformer |
| **API Docs** | Swagger (auto-generated) |
| **Deployment** | Railway |

---

## ✨ Features

### Authentication
- Signup with Name, Email, Password
- Secure JWT-based login with token refresh
- Auto-redirect on session expiry

### Project Management
- Create projects (creator automatically becomes Project Admin)
- Invite/remove team members via user search
- Members can view only their assigned projects

### Task Management
- Create tasks with Title, Description, Due Date, Priority (Low/Medium/High/Urgent)
- Assign tasks to project members only (validated on backend)
- Update task status: To Do → In Progress → Done
- Members can only update the status of tasks assigned to them

### Dashboard
- Total tasks count
- Tasks grouped by status (pie chart)
- Tasks grouped by priority (bar chart)
- Overdue tasks count
- Recent activity feed
- Tasks per user breakdown (Admin only)

### Role-Based Access Control (RBAC)
- **Admin (Global)**: Full platform access, can view all projects and tasks
- **Project Owner**: Can manage tasks, invite/remove members for their projects
- **Member**: Can view assigned projects and update status of assigned tasks only

---

## 📂 Project Structure

```
project-task/
├── backend/                  # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Seed data for demo
│   └── src/
│       ├── auth/             # JWT auth, guards, strategies
│       ├── projects/         # Project CRUD + member management
│       ├── tasks/            # Task CRUD with RBAC
│       ├── dashboard/        # Aggregated statistics
│       ├── users/            # User management
│       └── prisma/           # Prisma service
├── frontend/                 # Next.js App
│   ├── app/
│   │   ├── auth/             # Login & Signup pages
│   │   ├── dashboard/        # Dashboard with charts
│   │   ├── projects/         # Project list & detail views
│   │   ├── tasks/            # Task list, detail & Kanban
│   │   ├── kanban/           # Kanban board view
│   │   ├── profile/          # User profile page
│   │   └── settings/         # App settings
│   ├── components/           # Reusable UI components
│   ├── hooks/                # React Query hooks
│   ├── services/             # API service layer
│   ├── context/              # Auth context provider
│   └── lib/                  # Axios instance
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites

- **Node.js** >= 18
- **PostgreSQL** database (local or hosted)
- **yarn** or **npm**

### 1. Clone the Repository

```bash
git clone https://github.com/YashSharma2129/Ethara-ai-team-task-manager.git
cd Ethara-ai-team-task-manager
```

### 2. Backend Setup

```bash
cd backend
yarn install

# Create .env file
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/task_manager
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

Run database migrations and seed:

```bash
npx prisma migrate dev
yarn run seed
```

Start the backend:

```bash
yarn run start:dev
```

The API will be running at `http://localhost:3000`. Swagger docs at `http://localhost:3000/api`.

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local file
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Start the frontend:

```bash
npm run dev
```

The app will be running at `http://localhost:3001`.

---

## 🗄️ Database Schema

```
┌──────────┐     ┌──────────────┐     ┌─────────┐
│  Users   │────▶│ProjectMembers│◀────│Projects │
│          │     │  (junction)  │     │         │
│ id       │     │ projectId    │     │ id      │
│ name     │     │ userId       │     │ name    │
│ email    │     │ joinedAt     │     │ adminId │
│ role     │     └──────────────┘     │ status  │
│ password │                          └─────────┘
└──────────┘                               │
     │                                     │
     │          ┌──────────┐               │
     └─────────▶│  Tasks   │◀──────────────┘
                │ id       │
                │ title    │
                │ status   │
                │ priority │
                │ dueDate  │
                │ assignedToId │
                │ createdById  │
                │ projectId    │
                └──────────┘
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Register a new user |
| POST | `/api/v1/auth/login` | Login and get JWT |
| GET | `/api/v1/auth/me` | Get current user info |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects` | List all projects (filtered by role) |
| POST | `/api/v1/projects` | Create a new project |
| GET | `/api/v1/projects/:id` | Get project details with members |
| PATCH | `/api/v1/projects/:id` | Update project |
| DELETE | `/api/v1/projects/:id` | Delete project (admin only) |
| POST | `/api/v1/projects/:id/members` | Add member to project |
| DELETE | `/api/v1/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tasks` | List tasks (with filters & pagination) |
| POST | `/api/v1/tasks` | Create a new task |
| GET | `/api/v1/tasks/:id` | Get task details |
| PATCH | `/api/v1/tasks/:id` | Update task |
| DELETE | `/api/v1/tasks/:id` | Delete task (admin only) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard` | Get aggregated statistics |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List all users |
| GET | `/api/v1/users/me` | Get own profile |
| PATCH | `/api/v1/users/me` | Update own profile |

---

## 🚀 Deployment (Render)

### Backend (Web Service)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory**: `backend`
4. **Build Command**: `yarn install && npx prisma generate && npx prisma migrate deploy && yarn build`
5. **Start Command**: `yarn start:prod`
6. Set **Environment Variables**:
   - `DATABASE_URL` → from Render PostgreSQL instance
   - `JWT_SECRET` → your secret key
   - `JWT_EXPIRES_IN` → `7d`
   - `PORT` → `3000`
   - `NODE_ENV` → `production`
   - `CORS_ORIGIN` → your frontend Render URL

### Frontend (Static Site or Web Service)

1. Create another **Web Service** on Render
2. Connect your GitHub repo
3. Set **Root Directory**: `frontend`
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `npm start`
6. Set **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` → your deployed backend URL + `/api/v1`

### Database

1. Create a **PostgreSQL** instance on Render
2. Copy the **Internal Database URL** and set it as `DATABASE_URL` in your backend service
3. After first deploy, seed the database: connect via terminal and run `yarn run seed`

---

## 🧪 Seed Data

Run `yarn run seed` in the backend to populate demo data:

- **Admin user**: `admin@example.com` / `password123`
- **Member user**: `member@example.com` / `password123`
- **Sample project**: "Website Redesign" with 3 tasks (different statuses and priorities)

---

## 📝 Key Design Decisions

1. **Hybrid RBAC**: Global roles (Admin/Member) + project-scoped ownership. Any user can create projects and become its owner without needing global admin privileges.

2. **ProjectMember Junction Table**: Enables many-to-many relationships between Users and Projects with metadata (joinedAt).

3. **Backend Assignment Validation**: The backend verifies that a task's assignee is a member of the target project before allowing creation/update. This prevents invalid cross-project assignments.

4. **Transactional Project Creation**: Project creation and initial member insertion happen in a single Prisma `$transaction` to ensure data consistency.

5. **Scoped Dashboard**: Dashboard statistics are filtered by role — members see only their data, admins see platform-wide metrics.