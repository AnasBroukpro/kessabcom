# Kessabcom - Local Development Guide

This project is a full-stack React and Node.js application. The backend uses Express and the frontend uses Vite.

## Requirements
* Node.js (v22+ recommended)
* npm

## Initial Setup

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Variables:**
   A `.env` file has been created for local development.
   If you need to make changes, refer to `.env.example`.

3. **Firebase Credentials:**
   The backend uses the Firebase Admin SDK and Google Cloud Firestore SDK. These require credentials to authenticate locally.
   
   **Option A: gcloud Application Default Credentials (Recommended)**
   If you have the Google Cloud CLI installed, run:
   \`\`\`bash
   gcloud auth application-default login
   \`\`\`

   **Option B: Service Account JSON File**
   1. Go to your Firebase Console -> Project Settings -> Service Accounts.
   2. Click "Generate new private key" and download the JSON file.
   3. Save it in the root of this project as \`firebase-service-account.json\` (do not commit this file).
   4. Open the \`.env\` file and uncomment the following line:
      \`\`\`env
      GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
      \`\`\`

## Running the Application Locally

The development environment has been configured to work correctly on Windows. The dev scripts have been split to avoid ESM conflicts between \`tsx\` and Vite config.

To start both the API and the Frontend servers simultaneously, run:
\`\`\`bash
npm run dev
\`\`\`

* **Frontend (Vite):** http://localhost:5173
* **Backend API (Express):** http://localhost:3000 (The frontend proxies API calls here automatically).

*Note: In production (e.g. Vercel, Hostinger), the Express server serves the built Vite files from the \`dist\` folder directly on port 3000.*

## Troubleshooting

* **Firebase Auth Errors:** If login/register endpoints fail, ensure you have correctly set up your Firebase credentials (ADC or \`GOOGLE_APPLICATION_CREDENTIALS\`).
* **Port in Use:** If port 3000 or 5173 is in use, kill the existing process or change the port in \`server.ts\` / \`vite.config.ts\`.
