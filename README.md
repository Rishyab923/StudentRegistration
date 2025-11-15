# StudentRegistration (Node.js + Express + MongoDB)
Simple Student Course Registration app with real signup/login (bcrypt + express-session),
server-rendered EJS views and Bootstrap styling.

## Quick start (local)
1. Unzip repository to `D:\StudentRegistration` (on Windows).
2. In `backend` folder open terminal:
   ```
   cd D:\StudentRegistration
   npm install
   ```
3. Create a `.env` file (or copy `.env.example`) and set:
   ```
   MONGODB_URI=<your mongo atlas connection string>
   PORT=3000
   ```
4. Start:
   ```
   npm start
   ```
5. Open http://localhost:3000

## Deploy to Render (manual ZIP upload)
- Sign up on render.com, choose "Manual Deploy" (upload ZIP/TAR).
- Build command: `npm install`
- Start command: `npm start`
- Add environment variable: `MONGODB_URI` with your Atlas connection string.

