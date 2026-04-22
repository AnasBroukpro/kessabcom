
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkData() {
    console.log("Checking supportRequests collection...");
    const snap = await db.collection('supportRequests').get();
    console.log(`Found ${snap.size} documents.`);
    snap.forEach(doc => {
        console.log(`ID: ${doc.id}, Data:`, doc.data());
    });
}

checkData();
