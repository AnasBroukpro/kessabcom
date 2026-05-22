import "dotenv/config";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");
const appletConfigPath = path.join(process.cwd(), "firebase-applet-config.json");

let firebaseConfig: any = {};
if (fs.existsSync(appletConfigPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(appletConfigPath, "utf-8"));
} else {
  firebaseConfig = { projectId: process.env.FIREBASE_PROJECT_ID };
}

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: firebaseConfig.projectId,
  });
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

async function migrate() {
  console.log("🚀 Migration: Activation des comptes vendeurs existants...");

  const sellersSnap = await db.collection("users").where("role", "==", "seller").get();
  console.log(`📊 ${sellersSnap.size} vendeurs trouvés`);

  let updated = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const userDoc of sellersSnap.docs) {
    const uid = userDoc.id;
    const userData = userDoc.data();

    const wasAlreadyActivated = userData.accountActivated === true;

    // Activer le compte vendeur si pas déjà fait
    if (!wasAlreadyActivated) {
      batch.update(userDoc.ref, {
        accountActivated: true,
        accountActivationType: "grandfathered",
        plan: "باقة الانطلاق",
        updatedAt: FieldValue.serverTimestamp(),
      });
      batchCount++;
    }

    // Traiter TOUTES les annonces (même pour les vendeurs déjà activés)
    const listingsSnap = await db.collection("announcements").where("sellerId", "==", uid).get();
    for (const listingDoc of listingsSnap.docs) {
      const listingData = listingDoc.data();
      if (listingData.sellerAccountActivated === true) continue; // déjà bon
      const updateData: any = { sellerAccountActivated: true };
      if (listingData.status === "paused_for_payment") {
        updateData.status = "active";
      }
      batch.update(listingDoc.ref, updateData);
      batchCount++;
    }

    if (batchCount >= 400) {
      await batch.commit();
      console.log(`  ✅ Lot ${Math.floor(updated / 400) + 1} commit (${batchCount} opérations)`);
      updated += batchCount;
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`  ✅ Dernier lot commit (${batchCount} opérations)`);
    updated += batchCount;
  }

  console.log(`\n✅ Migration terminée : ${sellersSnap.size} vendeurs traités`);
}

migrate().catch(console.error);
