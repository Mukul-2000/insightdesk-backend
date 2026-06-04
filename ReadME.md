# LIVE SERVER API
https://insightdesk-backend.onrender.com

# InsightDesk Backend API 🚀

A secure Node.js & Express API for Retrieval-Augmented Generation (RAG) workflows using Google Gemini and MongoDB Atlas Vector Search.

## ✨ Features

* **JWT Authentication:** Secure user signup and login with token-guarded endpoints.
* **Smarter RAG Pipeline:** Combines chat history and document data to provide accurate context to Gemini.
* **Vector Search:** Multi-tenant search isolated securely by individual user IDs.
* **Local Storage:** Files are handled locally on disk for frictionless zero-cost testing.

## 🛠️ Tech Stack

* **Runtime & Framework:** Node.js, TypeScript, Express.js
* **Database:** MongoDB Atlas (Mongoose ODM)
* **AI Integration:** Official `@google/genai` SDK (`gemini-2.5-flash` & `gemini-embedding-2`)
* **Security:** `jsonwebtoken` & `bcryptjs`

## ⚙️ Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install


## Configure Environment Variables (.env):

``` PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_ai_studio_api_key
Run the Development Server:

Bash
npm run dev
🔌 API Endpoints
Auth
POST /api/auth/register - Create an account

POST /api/auth/login - Login and receive JWT token

Chat & Documents (Requires Bearer Token)
GET /api/chat/history - Fetch user's chat history

POST /api/chat - Send a message to the RAG pipeline

POST /api/documents/upload - Upload and vectorize a file ```