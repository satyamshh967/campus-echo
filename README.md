# Open Letter / Shoutout Board (MERN Stack)

A clean, text-based social feed web application where users can post open letters, shoutouts, or appreciation notes to peers, colleagues, or teams.

## Tech Stack
- **Database**: MongoDB (Mongoose schemas)
- **Backend**: Node.js & Express.js (MVC Architecture, JWT Auth, bcryptjs)
- **Frontend**: React (Vite), Axios, Context API
- **Styling**: Clean, flat UI inspired by Facebook/Instagram feeds (`#f0f2f5` background, `#ffffff` cards, `#dbdbdb` borders, mobile-first responsive layout with `overflow-x: hidden`).

---

## Project Structure

```text
EndTermProject/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, GetMe
│   │   └── letterController.js   # CRUD operations, Likes, Comments
│   ├── middleware/
│   │   └── auth.js               # JWT Bearer token authentication middleware
│   ├── models/
│   │   ├── User.js               # User schema (name, email, password)
│   │   └── Letter.js             # Letter schema (author, recipientName, content, likes, comments)
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   └── letterRoutes.js       # /api/letters routes
│   ├── .env.example
│   ├── package.json
│   └── server.js                 # Express server entry point
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js         # Axios client with JWT interceptor
    │   ├── context/
    │   │   └── AuthContext.jsx   # User state & authentication provider
    │   ├── components/
    │   │   ├── Navbar.jsx        # Flat web header with user badge & auth triggers
    │   │   ├── CreatePost.jsx    # Text-only shoutout publisher card
    │   │   ├── PostItem.jsx      # Individual post card with likes & comments
    │   │   ├── Feed.jsx          # Centered single-column feed container
    │   │   └── AuthModal.jsx     # Clean modal for Login / Register
    │   ├── App.jsx
    │   ├── App.css               # Facebook / Instagram feed styling rules
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

---

## Quick Start

### 1. Start MongoDB
Ensure MongoDB is running locally on port 27017 or provide a MongoDB Atlas URI in `backend/.env`:
```bash
MONGO_URI=mongodb://127.0.0.1:27017/shoutout_board
```

### 2. Run Backend
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
# Vite runs on http://localhost:5173
```
