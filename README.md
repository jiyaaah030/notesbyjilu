📚 NotesbyJilu

NotesbyJilu is a collaborative note-sharing platform designed to make study materials more accessible and organized for students. It enables users to upload, browse, and engage with academic notes in a community-driven environment.

The project focuses on simplicity, scalability, and user experience, blending a modern frontend with a secure backend for file handling and data management.

🚀 Key Features

Secure Authentication – User login and signup powered by Firebase Authentication.

Notes Uploads – Upload and manage academic resources (PDF, DOCX, etc.).

Metadata Storage – Tracks uploader details, file information, and community interactions.

Community Engagement – Like/dislike system to highlight useful notes.

User Profiles – Customizable profile pages with editable information and profile pictures.

Responsive Design – Clean, aesthetic UI built with Next.js and a custom color palette.

Robust Backend – Node.js, Express, and Multer for efficient file handling.

🛠️ Technology Stack

Frontend: Next.js, React, Tailwind CSS

Backend: Node.js, Express.js, Multer

Authentication: Firebase Authentication

Database: MongoDB

AI: Google Generative AI

Design: Custom responsive UI with consistent theming

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Firebase project with Authentication enabled
- Google Cloud project with Vertex AI enabled (for AI features)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd notesbyjilu
   ```

2. **Install frontend dependencies**

   ```bash
   npm install
   ```

3. **Install backend dependencies**

   ```bash
   cd upload-server
   npm install
   cd ..
   ```

4. **Set up environment variables**

   Create `.env.local` in the root directory:

   ```env
   # Backend URL (for production, set to your deployed backend URL)
   BACKEND_URL=http://localhost:3001

   # MongoDB connection string
   MONGO_URI=mongodb://localhost:27017/notesdb

   # Firebase service account key (JSON string)
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

   # Google API key for Vertex AI
   GOOGLE_API_KEY=your_google_api_key
   ```

   Create `.env` in the `upload-server` directory:

   ```env
   # MongoDB connection string
   MONGO_URI=mongodb://localhost:27017/notesdb

   # Firebase service account key file path
   FIREBASE_SERVICE_ACCOUNT_KEY_FILE=./firebase-service-account.json

   # Google API key for Vertex AI
   GOOGLE_API_KEY=your_google_api_key

   # CORS origins (comma-separated)
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001

   # Server port
   PORT=3001
   ```

5. **Set up Firebase**

   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication with Email/Password provider
   - Download the service account key JSON file and place it in `upload-server/firebase-service-account.json`
   - Update Firebase config in `src/lib/firebase.ts` with your project credentials

6. **Set up Google Cloud Vertex AI**

   - Create a Google Cloud project
   - Enable Vertex AI API
   - Generate an API key and add it to your environment variables

### Running the Application

1. **Start the backend server**

   ```bash
   cd upload-server
   npm start
   ```

   The backend will run on http://localhost:3001

2. **Start the frontend development server**

   ```bash
   npm run dev
   ```

   The frontend will run on http://localhost:3000

3. **Build for production**
   ```bash
   npm run build
   npm start
   ```

### Testing

Run the test suite for the backend:

```bash
cd upload-server
npm test
```

### Deployment

The application is configured for deployment on Vercel (frontend) and any Node.js hosting service (backend).

For Vercel deployment:

- Set the environment variables in your Vercel project settings
- The build command is `npm run build`
- The start command is `npm start`

🎯 Vision

NotesbyJilu aims to become a student-first knowledge hub, reducing barriers to quality resources and encouraging peer-to-peer learning. The platform is built with scalability in mind, allowing future enhancements like AI-powered note recommendations, study communities, and gamified engagement.

📄 License

Licensed under the MIT License. Free to use, adapt, and contribute.
