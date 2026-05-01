# Team Task Manager

A full-stack team collaboration app with projects, tasks, dashboard insights, and team directory.

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT

## Quick Setup

1. Install dependencies:
```bash
cd server && npm install
cd ../client && npm install
```

2. Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=change_this_to_a_long_random_secret
```

3. Run backend:
```bash
cd server
npm start
```

4. Run frontend:
```bash
cd client
npm run dev
```

Frontend runs on Vite default (`http://localhost:5173`) and backend on `http://localhost:5000`.

## Default Behavior
- Signup creates users with role/status/workload defaults.
- Role-based access is enforced for project/task actions.
- Dashboard and project activity refresh periodically for near real-time updates.
