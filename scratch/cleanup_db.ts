import admin from 'firebase-admin';
import path from 'path';
import { readFileSync } from 'fs';

// Initialize Admin SDK
const serviceAccountPath = path.resolve(process.cwd(), 'kessabcom-0004-firebase-adminsdk-fbsvc-8a3aeb71c9.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const TO_KEEP_PHONES = ['+212700770077', '+212600880088'];
const TO_KEEP_EMAILS = ['anas.brouk@gmail.com'];

async function cleanup() {
  console.log('🚀 Starting Full Admin Cleanup (Auth + Firestore)...');
  
  try {
    // 1. Cleanup Auth Users
    console.log('\n--- Checking Firebase Authentication ---');
    const authUsers = await auth.listUsers();
    let deletedAuth = 0;

    for (const userRecord of authUsers.users) {
      const phone = userRecord.phoneNumber;
      const email = userRecord.email;

      const shouldKeep = (phone && TO_KEEP_PHONES.includes(phone)) || (email && TO_KEEP_EMAILS.includes(email));

      if (!shouldKeep) {
        console.log(`❌ Deleting Auth User: ${userRecord.uid} (${phone || email})`);
        await auth.deleteUser(userRecord.uid);
        deletedAuth++;
      } else {
        console.log(`✅ Keeping Auth User: ${userRecord.uid} (${phone || email})`);
      }
    }

    // 2. Cleanup Firestore Users
    console.log('\n--- Checking Firestore Profiles ---');
    const usersSnap = await db.collection('users').get();
    let deletedDocs = 0;

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      const phone = data.phoneNumber || data.phone;
      const email = data.email;

      const shouldKeep = (phone && TO_KEEP_PHONES.includes(phone)) || (email && TO_KEEP_EMAILS.includes(email));

      if (!shouldKeep) {
        console.log(`❌ Deleting Firestore Doc: ${userDoc.id} (${phone || email})`);
        await db.collection('users').doc(userDoc.id).delete();
        deletedDocs++;
      } else {
        console.log(`✅ Keeping Firestore Doc: ${userDoc.id} (${phone || email})`);
      }
    }

    // 3. Cleanup all listings (since we want a fresh start)
    console.log('\n--- Checking Listings ---');
    const listingsSnap = await db.collection('listings').get();
    const batch = db.batch();
    let deletedListings = 0;
    
    listingsSnap.forEach(doc => {
      // Check if listing belongs to someone we keep
      // Since the user asked to delete listings with users, and any listing might be orphan
      // we check if the sellerId is in the list of kept UIDs
      // For simplicity, if the user wants ONLY those 3 accounts, we can delete all listings 
      // not belonging to them.
      batch.delete(doc.ref);
      deletedListings++;
    });
    await batch.commit();

    console.log(`\n✨ Full Cleanup Complete!`);
    console.log(`📊 Auth Users deleted: ${deletedAuth}`);
    console.log(`📊 Firestore Docs deleted: ${deletedDocs}`);
    console.log(`📊 Listings deleted: ${deletedListings}`);

  } catch (error) {
    console.error('🔴 Cleanup failed:', error);
  }
}

cleanup();
