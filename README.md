<div align="center">
  <img src="imgs/transparent KashefChatLogo.png" alt="KashefChat Logo" width="200" />
  <h1>KashefChat</h1>
  <p><em>Secure, real-time communication with built-in end-to-end encryption.</em></p>
</div>

## 📖 What is this?
KashefChat is a modern, full-stack chat application built for privacy and performance. It enables users to connect via real-time messaging, manage friend requests, and participate in private or group conversations. With a robust architecture supporting Google OAuth and end-to-end encryption, it ensures that your conversations remain secure and seamless across all devices.

## ✨ Key Features
- **End-to-End Encryption:** Messages are encrypted using secure keys (with KeyBackup and MessageKey tracking) so that only the intended recipients can read them.
- **Real-Time Messaging:** Powered by Socket.io, delivering instant message updates, read receipts, and typing indicators without needing to refresh.
- **Flexible Authentication:** Supports both traditional local accounts (email/password) and seamless Google OAuth 2.0 integration.
- **Friendship & Group Management:** Users can send, accept, or reject friend requests, and seamlessly transition from 1-on-1 private chats to group conversations.
- **Premium User Interface:** Built with React, Tailwind CSS, and Shadcn UI, providing a responsive, highly polished, and accessible dark/light mode experience.

## 🏗️ Architecture Overview
KashefChat follows a decoupled client-server architecture. The backend is an Express/Node.js server written in TypeScript, using Prisma ORM to interact with a PostgreSQL database. Real-time events are handled via a dedicated Socket.io layer. The frontend is a React application built with Vite, relying on TanStack Query for efficient server state management and caching, while communicating with the backend over REST for standard CRUD operations and WebSockets for real-time chat data.

### Message Sending Flow
![Message Sending Sequence Diagram](imgs/SeqDig-SendMessage.png)

### End-to-End Encryption Architecture
![Encryption and Decryption Flow](imgs/ENC-DEC-FlowChart.png)

## 💻 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js & Express** | Core backend server and REST API framework |
| **TypeScript** | Type safety across both frontend and backend |
| **Socket.io** | Bidirectional real-time event-driven communication |
| **Prisma & PostgreSQL**| Modern database ORM and relational data storage |
| **React (Vite)** | Fast, component-driven frontend architecture |
| **Tailwind CSS & Shadcn**| Utility-first styling and accessible UI components |
| **TanStack Query** | Data fetching, caching, and state synchronization |

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running
- A Google Cloud Console project (for OAuth credentials)

### Local Setup (Under 5 Minutes)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/KashefChat.git
   cd KashefChat
   ```

2. **Install dependencies:**
   Install for both backend and frontend.
   ```bash
   npm install
   cd frontEnd/snuggle-chat-30-main && npm install && cd ../..
   ```

3. **Environment Configuration:**
   Create a `.env` file in the root directory and populate it based on `Example.env`:
   ```env
   PORT=5000
   MAIN_CORS_ORIGIN=http://localhost:5173
   IO_CORS_ORIGIN=http://localhost:5173
   DATABASE_URL=postgresql://user:password@localhost:5432/kashefchat
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
   ```

4. **Initialize Database:**
   ```bash
   npm run prismaMig
   ```

5. **Run the Application Locally:**
   Open two terminal windows.
   - **Backend:** `npm run dev` (starts on port 5000)
   - **Frontend:** `cd frontEnd/snuggle-chat-30-main && npm run dev` (starts on port 5173)

## 📸 Screenshots & Demo
*Live Demo: [chatapp.kashefapps.cc](https://chatapp.kashefapps.cc)*


## 🧠 Challenges & What I Learned
Implementing robust End-to-End Encryption in a web environment while maintaining seamless multi-device syncing proved to be a complex architectural challenge. I learned how to securely manage key exchanges, optimize state with TanStack Query to prevent excessive re-renders during high-volume real-time messaging, and efficiently handle CORS across disparate deployment environments.
