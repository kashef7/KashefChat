

# KashefChat - React + Vite Chat Application Build Plan

## Overview

Build a full chat application with end-to-end encryption, porting all logic from the provided HTML files into a clean React project. The UI will match the design image using the color palette: `#FAF7F0` (cream background), `#D8D2C2` (warm gray), `#B17457` (brown/copper), `#4A4947` (dark charcoal).

---

## Design Screens (from the image, left to right)

1. **Login** - "Welcome Back" form with email/password, brown login button, Google sign-in
2. **Signup** - "Create Account" form with name/email/password/confirm, brown button, Google sign-in
3. **Home/Chats** - "Recent Chats" list with search bar, chat rows with avatars
4. **Chat Room** - Message bubbles (brown for sent, light for received), input bar with send/attachment
5. **Own Profile** - Avatar, name, email, stats (friends/chats/messages), about section, edit button
6. **Other User Profile** - Similar layout with "Add Friend" button
7. **Search** - Search users by name/email
8. **Notifications** - Friend requests with accept/decline, message notifications

---

## Project Structure

```text
src/
  config/
    index.ts              ← API_BASE_URL, SOCKET_URL, GOOGLE_AUTH_URL (from config.js)
  crypto/
    keyGeneration.ts      ← RSA key pair generation, password-based encryption
    messageEncryption.ts  ← AES-GCM encrypt/decrypt, RSA key wrapping
  api/
    auth.ts               ← login, signup, logout, Google OAuth
    user.ts               ← getMe, updateGoogleUser
    friendship.ts         ← sendRequest, respond, getFriends, getPending
    chat.ts               ← startChat, fetchMessages
  context/
    AuthContext.tsx        ← current user state, login/logout, privateKey management
    SocketContext.tsx      ← Socket.IO connection, event handling
  hooks/
    useAuth.ts            ← consume AuthContext
    useSocket.ts          ← consume SocketContext
    useChat.ts            ← message fetching, pagination, send/delete
    useFriends.ts         ← friends list, requests, send/respond
  components/
    ProtectedRoute.tsx    ← redirect to /login if not authenticated
    Layout.tsx            ← bottom navigation bar (Home, Search, Profile)
    ChatRow.tsx           ← single chat list item with avatar
    MessageBubble.tsx     ← sent/received message with timestamp
    FriendRequestCard.tsx ← accept/decline UI
    UserCard.tsx          ← user search result with Add Friend
    BottomNav.tsx         ← bottom navigation component
  pages/
    Login.tsx             ← ported from index.html login section
    Signup.tsx            ← ported from index.html signup section
    Home.tsx              ← chat list (adapted from friends.html friends list)
    Chat.tsx              ← ported from chat.html (messages, encryption, socket)
    Profile.tsx           ← own profile with edit/logout
    UserProfile.tsx       ← other user's profile with Add Friend
    Search.tsx            ← search users
    Notifications.tsx     ← friend requests (from friends.html pending section)
  router/
    index.tsx             ← React Router setup with protected routes
```

---

## Implementation Steps

### Step 1: Config & API Layer
- Create `src/config/index.ts` with the three URLs from config.js
- Create API modules (`auth.ts`, `user.ts`, `friendship.ts`, `chat.ts`) porting all `fetch` calls from the HTML files using the same endpoints, methods, headers, and `credentials: "include"`

### Step 2: Crypto Utilities
- Port `KeyGenerationService` into `src/crypto/keyGeneration.ts` (RSA key pair gen, PBKDF2-based private key encryption)
- Port `messageEndToEndEncryptionService` into `src/crypto/messageEncryption.ts` (AES-GCM encrypt/decrypt, RSA-OAEP key wrapping, `importRsaPublicKey`, `decryptPrivateKeyFromBackup`)

### Step 3: Auth Context & Socket Context
- **AuthContext**: manages `currentUser`, `privateKey` (from localStorage), login/signup/logout functions. On login, restores private key from backup using `decryptPrivateKeyFromBackup`. On signup, generates keys via `KeyGenerationService` and stores private key.
- **SocketContext**: creates Socket.IO connection with `withCredentials: true`, emits `join` with userId on auth, exposes socket instance to children.

### Step 4: Pages (porting logic from HTML files)

**Login & Signup** (from `index.html`):
- Login form → calls `POST /auth/logIn`, then `GET /user/me`, restores private key from KeyBackup
- Signup form → calls `KeyGenerationService`, then `POST /auth/signUp` with publicKey/encryptedPrivateKey
- Google button → redirects to `GOOGLE_AUTH_URL`

**Home** (adapted from `friends.html`):
- Fetches friends list via `GET /friendship/`
- Displays as chat rows with avatars, last message preview
- Search bar filters locally
- Clicking a friend calls `POST /chat/startChat` and navigates to `/chat/:id`

**Chat** (from `chat.html`):
- Fetches messages via `GET /chat/:chatId` with cursor pagination
- Decrypts each message using stored privateKey + per-message encrypted AES key
- Sends messages: generates AES key, encrypts content, wraps AES key with each member's RSA public key, emits `sendMessage` via socket
- Listens for `receiveMessage`, `messageDeleted`, `messageRead` socket events
- Context menu on own messages for delete

**Notifications** (from `friends.html` pending requests section):
- Fetches `GET /friendship/PendingRequestsReceived`
- Accept/Decline calls `POST /friendship/respondToRequest` with `Accepted`/`Rejected`
- Socket events: `friendRequestReceived`, `friendRequestResponded`

**Profile & UserProfile**:
- Own profile: displays user data from `GET /user/me`, logout button
- Other user profile: TODO placeholder for fetching user by ID, Add Friend button

**Search**:
- TODO placeholder for user search endpoint (not in HTML files)
- UI with search input and results list with Add Friend buttons

### Step 5: Routing & Navigation
- React Router with routes: `/login`, `/signup`, `/`, `/chat/:id`, `/profile`, `/user/:id`, `/notifications`, `/search`
- `ProtectedRoute` wrapper checks auth state, redirects to `/login`
- Bottom navigation bar on authenticated pages (Home, Search, Notifications, Profile icons)

### Step 6: Styling
- All custom CSS (no UI library beyond existing shadcn components for basic primitives)
- Color palette applied via CSS variables:
  - Background: `#FAF7F0`
  - Secondary/borders: `#D8D2C2`
  - Primary/buttons: `#B17457`
  - Text/dark: `#4A4947`
- Mobile-first layout matching the design (card-style forms, rounded message bubbles, bottom nav)
- Brown sent messages, light cream received messages
- Rounded avatars, warm typography

---

## Technical Notes

- **No Supabase** — this project uses a custom backend API with cookie-based auth (`credentials: "include"`)
- **Socket.IO** — `socket.io-client` package needed
- **Web Crypto API** — all encryption runs in-browser using `crypto.subtle`
- **Private key** stored in `localStorage` (matching existing HTML behavior)
- Features not in HTML files (search endpoint, user profile endpoint) will have TODO comments with expected input/output

