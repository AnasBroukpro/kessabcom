
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
const auth = admin.auth();

async function cleanup() {
    const phonesToDelete = ['0611442064', '+212611442064', '611442064'];
    console.log("Cleaning up Firestore for phones:", phonesToDelete);

    for (const phone of phonesToDelete) {
        const snap = await db.collection('users').where('phoneNumber', '==', phone).get();
        for (const doc of snap.docs) {
            const uid = doc.id;
            console.log(`Checking UID: ${uid} (Stored phone: ${phone})`);
            
            try {
                const authUser = await auth.getUser(uid);
                console.log(`  User exists in Auth. Auth Phone: ${authUser.phoneNumber}, Auth Email: ${authUser.email}`);
                
                // If Auth phone doesn't match Firestore phone, and Firestore phone is the one we want to free up
                if (authUser.phoneNumber !== phone && authUser.email !== `${phone.replace(/\D/g, '').substring(1)}@kessabcom.ma`) {
                    console.log(`  ⚠️ Inconsistency found! Freeing up phone ${phone} for this UID.`);
                    await doc.ref.update({ phoneNumber: authUser.phoneNumber || '' });
                } else {
                    console.log(`  ✅ Auth matches Firestore. This is a legitimate account.`);
                }
            } catch (e: any) {
                if (e.code === 'auth/user-not-found') {
                    console.log(`  🧹 Orphaned record found. Deleting Firestore doc ${uid}`);
                    await doc.ref.delete();
                } else {
                    console.error(`  ❌ Error checking Auth for ${uid}:`, e.message);
                }
            }
        }
    }
    console.log("Cleanup complete.");
}

cleanup();
