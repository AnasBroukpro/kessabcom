
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

async function findUser() {
    const phones = ['0611442064', '+212611442064', '611442064'];
    console.log("Searching for user with phones:", phones);
    
    for (const phone of phones) {
        const snap = await db.collection('users').where('phoneNumber', '==', phone).get();
        console.log(`Query for "${phone}": Found ${snap.size} docs`);
        snap.forEach(doc => {
            console.log(`ID: ${doc.id}, Data:`, doc.data());
        });
    }

    const email = '611442064@kessabcom.ma';
    const snapEmail = await db.collection('users').where('email', '==', email).get();
    console.log(`Query for email "${email}": Found ${snapEmail.size} docs`);
    snapEmail.forEach(doc => {
        console.log(`ID: ${doc.id}, Data:`, doc.data());
    });
}

findUser();
