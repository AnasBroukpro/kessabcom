
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Use service account if available
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} else {
  // Fallback to env vars or default
  if (!admin.apps.length) {
    admin.initializeApp();
  }
}

const db = admin.firestore();

async function duplicateAnnouncements() {
  console.log('🚀 Fetching announcements...');
  const snap = await db.collection('announcements').get();
  console.log(`📦 Found ${snap.size} announcements to duplicate.`);

  const batch = db.batch();
  let count = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    // Create a new document reference with a new ID
    const newRef = db.collection('announcements').doc();
    
    // Copy all data
    const newData = {
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // We might want to mark them as duplicates or something, but the user just said duplicate
    };

    batch.set(newRef, newData);
    count++;

    // Commit every 400 docs (Firestore batch limit is 500)
    if (count % 400 === 0) {
      await batch.commit();
      console.log(`✅ Committed ${count} duplicates...`);
    }
  }

  if (count % 400 !== 0) {
    await batch.commit();
  }

  console.log(`🎉 Finished duplicating ${count} announcements. Total new announcements added: ${count}.`);
}

duplicateAnnouncements().catch(console.error);
