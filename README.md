# CampusEcho — Campus Peer Recognition & Shoutout Network

> **A workflow-driven campus recognition and peer-impact ecosystem built on the MERN stack.**

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/satyamshh967/campus-echo)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-Google%20Drive-4285F4?logo=googledrive)](#️-project-demo-video)
[![Tech Stack](https://img.shields.io/badge/Stack-MongoDB%20%7C%20Express%20%7C%20React%20%7C%20Node-blue)](#5-tech-stack)
[![UI Style](https://img.shields.io/badge/UI-Flat%20Facebook%2FInstagram%20Feed-1877f2)](#7-user-interface--styling)

---

## 📽️ Project Demo Video

- **Video Walkthrough**: [Watch Project Demo Walkthrough (Google Drive)](PASTE_YOUR_GOOGLE_DRIVE_LINK_HERE)
- **Viewing Access**: Set to **"Anyone with the link can view"** for evaluator access without requiring permissions.
- **Walkthrough Guide**: Detailed scene-by-scene script available in [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md).

---

## 1. Problem Statement
In university and college environments, everyday acts of peer support—such as late-night lab help, hackathon teamwork, study group mentoring, hostel favors, and student club coordination—often go unacknowledged. 

Mainstream social networks (Instagram, X) are noisy, algorithmically distracted, and susceptible to toxicity, while professional platforms (LinkedIn) feel overly transactional and corporate. Campuses lack a dedicated, positive, and authentic channel to celebrate everyday peer contributions and foster community culture.

---

## 2. Target Users
- **College & University Students**: Giving and receiving peer recognition across batches and departments.
- **Student Club Leaders & Hackathon Teams**: Publicly commending contributors, organizers, and problem-solvers.
- **Teaching Assistants & Mentors**: Recognizing dedicated peers and academic helpers.

---

## 3. Solution
**CampusEcho** solves this problem by providing a focused, text-only recognition feed combined with meaningful software engineering workflows:
1. **Targeted Campus Categorization & Honors Badges**: Direct shoutouts to specific categories (`Academics`, `Hackathons & Tech`, `Club & Cultural`, etc.) and badge achievements (`Problem Solver`, `Lifesaver`, `Team Player`).
2. **Anonymous Attribution**: Students can express heartfelt appreciation privately with an anonymous toggle, masking their identity on the public feed while preserving security logs.
3. **Campus Karma Impact Engine**: Translates peer appreciation into an earned impact score and campus leaderboard.
4. **Trust, Safety & Auto-Quarantine Pipeline**: Community moderation system that automatically quarantines harmful posts once reported by 3 or more users.
5. **In-App Notification Center**: Notifies users in real-time when they receive shoutouts, reactions, or comments.

---

## 4. Key Workflows & Engineering Features

### Workflow 1: Recognition & Attribution
- Compose shoutouts with recipient targeting, category classification, and honor badges.
- Choose delivery mode: **Public** or **Protected Anonymous** (`isAnonymous: true`).
- Author receives `+5 Echo Karma` points for contributing positive recognition.

### Workflow 2: Discovery & Search Engine
- Real-time search across recipient names and content keywords.
- Category filter pills (`All`, `Academics`, `Hackathons & Tech`, `Club & Cultural`, `Peer Mentorship`, `Campus Life`).
- Three-mode sorting:
  - **🔥 Trending**: Ranked dynamically by a decay algorithm:
    $$\text{Trending Score} = \frac{\text{Reactions} \times 2 + \text{Comments} \times 3 + 1}{(\text{Hours Since Post} + 2)^{1.5}}$$
  - **⏱️ Latest**: Strict reverse-chronological order.
  - **⭐ Top Impact**: Ranked by total community engagement.

### Workflow 3: Multi-Reactions & Campus Karma Engine
- Multi-reaction picker offering 4 distinct sentiments:
  - 👏 **Applause** (Clap)
  - ❤️ **Heart** (Love)
  - 💡 **Insightful** (Lightbulb)
  - 🚀 **Inspiring** (Rocket)
- Authors receive `+2 Karma` per reaction and `+3 Karma` per comment.
- Dynamic **Campus Karma Leaderboard** ranking top contributors.

### Workflow 4: Community Trust, Safety & Moderation
- In-post reporting modal with taxonomy (`Harassment`, `Hate Speech`, `Spam`, `Inappropriate Content`).
- Automated moderation rule: when a post accumulates **3 or more reports**, its status automatically shifts to `quarantined`, removing it from the public feed immediately.

### Workflow 5: Personal Bookmarks & In-App Notifications
- Personal **Saved Shoutouts** drawer (`/saved`) to bookmark meaningful notes.
- In-app notification bell with unread badge counter and mark-as-read workflows.

---

## 5. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Database** | MongoDB & Mongoose | Relational document modeling, subdocument comments/reactions, text indexing |
| **Backend** | Node.js & Express.js | MVC Architecture, JWT authentication, moderation rules, trending algorithm |
| **Frontend** | React (Vite) | Single-page application, custom Context API state management |
| **Styling** | Vanilla CSS (Flat UI) | Mobile-first, strict zero-gradient/zero-shadow Facebook/Instagram feed aesthetic |
| **Networking** | Axios | Interceptors for automated JWT injection and 401 session expiry |

---

## 6. Architecture & System Design

```text
               ┌─────────────────────────────────────────────────────┐
               │                   React Frontend                     │
               │  (Navbar, Feed, CreatePost, PostItem, Leaderboard)   │
               └──────────────────────────┬──────────────────────────┘
                                          │ HTTP / REST (JWT Auth)
                                          ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                           Express MVC Backend                               │
│  ├── Routes: /api/auth, /api/letters, /api/notifications                   │
│  ├── Middleware: protect (JWT validation & session decoding)               │
│  ├── Controllers: authController, letterController, notificationController │
│  └── Logic Engine: Karma Calculator, Trending Decay, Auto-Quarantine      │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │ Mongoose ODM
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                             MongoDB Database                               │
│  ├── Users: credentials, department, karmaScore, savedLetters              │
│  ├── Letters: author, recipient, category, badge, isAnonymous, reactions   │
│  ├── Notifications: recipient, sender, type, message, isRead               │
│  └── Reports: letter, reporter, reason, details, status                    │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. User Interface & Styling

- **Page Background**: Light gray (`#f0f2f5`)
- **Card Background**: Pure white (`#ffffff`)
- **Separators & Dividers**: Subtle borders (`#e4e6eb` / `#dbdbdb`)
- **Feed Constraints**: Centered single-column layout with `max-width: 640px`
- **Scrolling Behavior**: Strict `overflow-x: hidden` preventing any horizontal scrolling

---

## 8. Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port 27017 or a MongoDB Atlas connection string

### 1. Clone the Repository
```bash
git clone https://github.com/satyamshh967/campus-echo.git
cd campus-echo
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
*Backend server will run at `http://localhost:5000`.*

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
*Vite dev server will start at `http://localhost:5173`.*

---

## 9. Environment Variables

Create a `.env` file in the `backend/` directory:

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/shoutout_board` |
| `JWT_SECRET` | Secret key for JWT signing | `supersecret_jwt_key_openletter_board_2026` |

Optional for frontend:
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | API base URL for Axios client | `http://localhost:5000/api` |

---

## 10. Deployment Guide

### Backend (Render / Railway)
1. Push repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set **Root Directory** to `backend`.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `node server.js`.
6. Add environment variables (`MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`).

### Frontend (Vercel)
1. Create a new project on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `dist`.
5. Add environment variable `VITE_API_URL=https://<your-backend-url>/api`.

---

## 11. Project Authorship
- **Project**: CampusEcho
- **Author**: Satyam Sharma
- **Academic Context**: Scaler End-Term Software Project
