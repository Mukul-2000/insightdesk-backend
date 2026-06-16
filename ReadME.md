# InsightDesk — Backend API

> Production-grade Node.js/TypeScript REST + WebSocket server powering the InsightDesk AI productivity workspace.

🌐 **Live API:** [Render](https://insightdesk-backend.onrender.com/health) &nbsp;|&nbsp; 📦 **Frontend Repo:** [InsightDesk Frontend](#)

---

## 🚀 Overview

InsightDesk Backend is a unified Node.js HTTP + WebSocket server built with TypeScript and Express. It handles secure authentication, AWS S3 document management, MongoDB persistent chat history, and orchestrates a cross-vendor AI fleet (Groq + Gemini) through a custom Dual-Protocol Bridge.

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | MongoDB Atlas + Mongoose ODM |
| Real-Time | Socket.IO (unified HTTP + WS server) |
| Cloud Storage | AWS S3 + Multer In-Memory Buffer |
| Authentication | Google OAuth 2.0 + JWT + Crypto Hashing |
| AI Fleet | Groq SDK (Whisper-Large-v3-Turbo, Llama-3.3-70B) + Google Gen AI SDK (Gemini-2.5-Flash) |
| Testing | Jest + Supertest |
| DevOps | Git (main/dev branching) + Render Auto-Deploy |

---

## 🏗️ Architecture

```
Client Request
      │
      ├── HTTP POST (large media files)
      │       │
      │       ▼
      │   Multer Memory Buffer (RAM only, zero disk writes)
      │       │
      │       ▼
      │   AI Fleet Orchestrator
      │       ├── Groq Whisper  → Audio transcription
      │       ├── Groq Llama 3.3 → Long-form prose generation
      │       └── Gemini 2.5 Flash → Data parsing + quality audits
      │
      └── WebSocket (Socket.IO)
              │
              ▼
          Real-time status updates → Client UI Stepper
```

### Dual-Protocol Bridge
Large media files travel over **HTTP POST** while carrying the client's unique `socket.id` in metadata. The backend uses this to broadcast real-time agent status updates over **WebSockets** back to the UI while the heavy file processes in parallel — eliminating network congestion.

### Memory-Buffer Optimization
All media files up to 25MB are routed strictly through **transient Multer RAM buffers**, streamed directly to extraction endpoints, and instantly discarded — bypassing local disk writes and eliminating AWS S3 storage costs for temporary files.

---

## 📁 Folder Structure

```
backend/
├── src/
│   ├── config/           # DB, AWS S3, environment config
│   ├── controllers/      # Route handler logic
│   ├── middlewares/      # Auth, error handling, file upload
│   ├── models/           # Mongoose schemas (User, Chat, Document)
│   ├── routes/           # Express route definitions
│   ├── services/         # AI fleet, S3, socket services
│   ├── sockets/          # Socket.IO event handlers
│   ├── utils/            # Helper functions
│   └── server.ts         # Unified HTTP + WebSocket entry point
├── tests/                # Jest + Supertest test suites
├── .env.example          # Environment variable template
├── tsconfig.json
└── package.json
```

---

## 🔐 Authentication Flow

```
User clicks "Login with Google"
        ↓
Google OAuth 2.0 consent screen
        ↓
Backend receives authorization code
        ↓
Exchanges code for Google user profile
        ↓
Creates/finds user in MongoDB
        ↓
Signs JWT (7 day expiry)
        ↓
Returns token to client
        ↓
Client sends JWT in Authorization header
        ↓
Auth middleware verifies on every protected route
```

---

## 🤖 AI Fleet Orchestration

| Model | Provider | Used For |
|---|---|---|
| Whisper-Large-v3-Turbo | Groq | Audio/video transcription |
| Llama-3.3-70B | Groq | Long-form prose + copywriting |
| Gemini-2.5-Flash | Google | Data parsing + quality audits |

**Cross-Vendor Free Tier Routing:** Each vendor is chosen based on domain strength — $0 infrastructure spend across the entire AI pipeline.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/google` | Initiate Google OAuth flow |
| GET | `/api/auth/google/callback` | OAuth callback handler |
| POST | `/api/auth/logout` | Logout and clear session |
| GET | `/api/auth/me` | Get current user profile |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/documents/upload` | Upload document to AWS S3 |
| GET | `/api/documents` | List user documents |
| DELETE | `/api/documents/:id` | Delete document from S3 + DB |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | Send message to AI assistant |
| GET | `/api/chat/history` | Get persistent chat history |
| DELETE | `/api/chat/history` | Clear chat history |

### Content Studio
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/studio/process` | Process media through AI fleet |
| GET | `/api/studio/status` | Get processing status |

---

## 🔌 WebSocket Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join` | `{ userId }` | Join user's private room |
| `chat:message` | `{ message, sessionId }` | Send chat message |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `agent:status` | `{ step, status, message }` | Real-time AI processing updates |
| `chat:response` | `{ message, timestamp }` | AI chat response |
| `processing:complete` | `{ result }` | Content Studio completion |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

**Test Coverage:**
- ✅ Auth middleware isolation
- ✅ API endpoint integration tests
- ✅ Error handling scenarios
- ✅ JWT verification

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- AWS S3 bucket
- Google OAuth 2.0 credentials
- Groq API key
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/Mukul-2000/insightdesk-backend

# Install dependencies
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Fill in your credentials

# Run in development
npm run dev

# Build for production
npm run build
npm start
```

### Environment Variables

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_s3_bucket_name
AWS_REGION=your_aws_region
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:3000
```

---

## 🔄 CI/CD Pipeline

```
Developer pushes to dev branch
        ↓
Local testing passes
        ↓
PR merged into main
        ↓
Render auto-detects main branch push
        ↓
Builds TypeScript → JavaScript
        ↓
Deploys to auto-recycling container
        ↓
CORS whitelist enforced (production URLs only)
```

---

## 🛡️ Security

- Google OAuth 2.0 federated identity — no password storage
- JWT tokens with 7 day expiry
- Crypto hashing for sensitive data
- CORS whitelist — production URLs only
- Environment variables for all secrets
- Multer file size limits (25MB max)
- Auth middleware on all protected routes

---

## 👨‍💻 Author

**Mukul Sindhu** — Full Stack Developer
- Portfolio: [mukulsindhu.netlify.app](https://mukulsindhu.netlify.app)
- GitHub: [github.com/Mukul-2000](https://github.com/Mukul-2000)
- Email: imukulsindhu@gmail.com
