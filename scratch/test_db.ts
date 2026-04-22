import "dotenv/config";
import { Firestore } from '@google-cloud/firestore';
import fs from "fs";
import path from "path";

const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");
const firestoreOptions: any = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  databaseId: process.env.FIRESTORE_DATABASE_ID || "(default)",
};

if (fs.existsSync(serviceAccountPath)) {
  firestoreOptions.keyFilename = serviceAccountPath;
}

async function test() {
  try {
    console.log("Connecting to Firestore...");
    const db = new Firestore(firestoreOptions);
    const snap = await db.collection('settings').get();
    console.log(`Success! Found ${snap.size} settings docs.`);
    process.exit(0);
  } catch (e) {
    console.error("Firestore Error:", e);
    process.exit(1);
  }
}

test();
