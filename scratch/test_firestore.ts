
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

async function test() {
    try {
        console.log("Testing Firestore write...");
        const testRef = db.collection('test').doc('connectivity_check');
        await testRef.set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'ok'
        });
        console.log("✅ Write successful!");
        
        const snap = await testRef.get();
        console.log("✅ Read successful:", snap.data());
        
        await testRef.delete();
        console.log("✅ Delete successful!");
    } catch (e) {
        console.error("❌ Firestore Test Failed:", e);
    }
}

test();
