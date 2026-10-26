# CampusEcho — Demo Video Recording Script & Cue Card

> **Target Duration**: 3:30 to 4:00 minutes  
> **Student Name**: Satyam Sharma  
> **Project**: CampusEcho (Campus Peer Recognition & Shoutout Network)  
> **Stack**: MongoDB, Express.js (MVC), React, Node.js (MERN)

---

## 📋 30-Second Pre-Recording Checklist

1. **Start Servers**: Ensure `http://localhost:5173` (Frontend) and `http://localhost:5000` (Backend) are running.
2. **Reset Demo Data**: Run `cd backend && npm run seed` to load fresh sample campus shoutouts and users.
3. **Login Account**: Log in as `alex@campus.edu` (password: `password123`).
4. **Browser Setup**: Zoom set to `100%` or `110%`, close bookmark bars and unrelated tabs for a clean screen.
5. **Recording Tool**: Loom (screen + webcam bubble) or Windows Screen Recorder (`Win + Alt + R`).

---

## 🎬 Scene-by-Scene Walkthrough

### ⏱️ Scene 1: Introduction & Problem Statement (0:00 – 0:40)
- **On Screen**: CampusEcho Main Feed (`http://localhost:5173`).
- **Spoken Script**:
  > *"Hi everyone, my name is Satyam Sharma. Today I'm demonstrating **CampusEcho**, a peer recognition and open shoutout platform built on the MERN stack.*
  > 
  > *In college environments, everyday acts of peer support—late-night lab debugging, hackathon teaming, exam mentoring, hostel favors, and student club coordination—often go unacknowledged.*
  > 
  > *Mainstream social networks are noisy and toxic, while professional networks like LinkedIn feel too transactional. CampusEcho provides a dedicated, positive, text-only recognition feed combined with deep algorithmic workflows like dynamic trending decay, an automated karma impact engine, and community trust and safety moderation."*

---

### ⏱️ Scene 2: Workflow 1 — Targeted Recognition, Badges & Anonymity (0:40 – 1:25)
- **On Screen**: Top composer card ("Post an Open Letter / Shoutout").
- **Actions**:
  1. Click the recipient input $\rightarrow$ Type `Sarah Connor`.
  2. Select Category dropdown $\rightarrow$ Choose `Hackathons & Tech`.
  3. Select Honor Badge dropdown $\rightarrow$ Choose `🏆 Problem Solver`.
  4. In the text area, type:
     `"Huge shoutout for staying up late to fix our authentication API bugs before the hackathon submission deadline!"`
  5. Check the **Post as Anonymous Student** box $\rightarrow$ Point out how identity is masked publicly while preserving security logs.
  6. Click **Post Shoutout**.
- **Spoken Script**:
  > *"Notice how the new shoutout immediately prepends to the stream with its category tag and honor badge. Furthermore, our user's Echo Karma in the top right increases by +5 points for contributing positive peer recognition."*

---

### ⏱️ Scene 3: Workflow 2 — Discovery Engine, Filtering & Dynamic Sorting (1:25 – 2:10)
- **On Screen**: Search bar, category filter pills, and sort buttons.
- **Actions**:
  1. Click category pills: `Academics`, then `Peer Mentorship`. Point out the active filter banner: *"Filtering by 'Academics' • [Clear filters]"*.
  2. In the search bar, type `Figma` or `Sarah` $\rightarrow$ Show real-time instant filtering. Click `Clear`.
  3. Cycle through the sorting tabs:
     - **🔥 Trending**: Explain the decay formula:
       $$\text{Trending Score} = \frac{\text{Reactions} \times 2 + \text{Comments} \times 3 + 1}{(\text{Hours} + 2)^{1.5}}$$
     - **⏱️ Latest**: Strict reverse chronological stream.
     - **⭐ Top Impact**: Ranked by total community discussion and reaction volume.

---

### ⏱️ Scene 4: Workflow 3 — Multi-Reactions, Comments & Campus Karma Leaderboard (2:10 – 2:55)
- **On Screen**: Post interaction buttons and the Leaderboard tab.
- **Actions**:
  1. Hover over the **React** button on any card $\rightarrow$ Show the floating Facebook/LinkedIn-style popover (👏 *Clap*, ❤️ *Love*, 💡 *Insightful*, 🚀 *Inspiring*).
  2. Click 🚀 *Inspiring* $\rightarrow$ Show reaction count and emoji badge updating instantly.
  3. Click **Share** $\rightarrow$ Show the green `"Copied!"` link feedback.
  4. Click the **Leaderboard** tab in the top navigation.
- **Spoken Script**:
  > *"Every peer reaction and comment translates into campus impact points. Here on the Leaderboard, students are ranked by their overall Echo Karma score, alongside analytics of the most celebrated honor badges across campus."*

---

### ⏱️ Scene 5: Workflow 4 & 5 — Trust & Safety Moderation, Bookmarks & Alerts (2:55 – 3:35)
- **On Screen**: Flag icon, Save button, and Notification bell.
- **Actions**:
  1. Switch back to the **Feed** tab.
  2. Click the flag icon on any post $\rightarrow$ Show the **Report Shoutout** modal with reasons (`Harassment`, `Spam`, `Inappropriate Content`).
  3. Explain the auto-quarantine rule:
     > *"To protect our campus community, CampusEcho features an automated moderation pipeline: if a post receives 3 or more community reports, the server automatically quarantines it, immediately removing it from the public feed."*
  4. Click **Save** on a post $\rightarrow$ Switch to the **Saved** tab to demonstrate personal bookmarks.
  5. Click the **Notification Bell** in the navbar $\rightarrow$ Show the drawer with real-time alerts.

---

### ⏱️ Scene 6: Mobile-First Responsive Design & Conclusion (3:35 – 4:00)
- **On Screen**: Browser resize to mobile view ($\le 640\text{px}$).
- **Actions**:
  1. Drag the browser window width down to mobile size.
  2. Show the native **Mobile Bottom Navigation Bar** with Feed, Leaderboard, Saved, and Alerts icons.
- **Spoken Script**:
  > *"The entire UI strictly follows a clean Facebook/Instagram web aesthetic, with zero heavy drop shadows, full mobile responsiveness, and zero horizontal overflow.*
  > 
  > *Under the hood, the application features an Express MVC architecture, MongoDB relational document models, JWT authentication, and has passed 50 automated functional, security, and concurrency stress tests.*
  > 
  > *Thank you!"*

---

## 📤 Post-Recording: Google Drive Link Sharing

1. Upload the recorded `.mp4` file to **Google Drive** ([drive.google.com](https://drive.google.com)).
2. Right-click the video file $\rightarrow$ **Share** $\rightarrow$ **General access**: Change to **"Anyone with the link"** (Role: **Viewer**).
3. Copy the link and verify it in an **Incognito Browser Window**.
4. Paste the link into the **Official Scaler Submission Form**: [https://forms.gle/sBy4sfqyiRG2Zpom9](https://forms.gle/sBy4sfqyiRG2Zpom9) and in `README.md`.
