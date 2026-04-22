import admin from 'firebase-admin';
import path from 'path';
import { readFileSync } from 'fs';

const serviceAccountPath = path.resolve(process.cwd(), 'kessabcom-0004-firebase-adminsdk-fbsvc-8a3aeb71c9.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listCollections() {
  const collections = await db.listCollections();
  console.log('Collections:', collections.map(c => c.id));
  
  for (const coll of collections) {
    const snap = await coll.limit(5).get();
    console.log(`\n--- Collection: ${coll.id} (Top 5) ---`);
    snap.forEach(doc => {
      console.log(`ID: ${doc.id}`, doc.data());
    });
  }
}

listCollections();
