/**
 * delete-listing.js
 * Deletes the listing with ID 9YGHUHXnKMUdOhK7JANm from Firestore.
 * Run with: node scratch/delete-listing.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const LISTING_ID = '9YGHUHXnKMUdOhK7JANm';

async function deleteListing() {
  const listingRef = db.collection('announcements').doc(LISTING_ID);
  const snap = await listingRef.get();

  if (!snap.exists) {
    console.log(`❌ Listing "${LISTING_ID}" introuvable dans la collection 'announcements'.`);
    process.exit(1);
  }

  const data = snap.data();
  console.log(`🔍 Trouvé : "${data.title || '(sans titre)'}" — vendeur: ${data.sellerName || data.sellerPseudo || 'inconnu'}`);
  console.log('🗑️  Suppression en cours...');

  await listingRef.delete();
  console.log(`✅ Listing "${LISTING_ID}" supprimé avec succès de Firestore.`);

  process.exit(0);
}

deleteListing().catch((err) => {
  console.error('❌ Erreur lors de la suppression :', err.message);
  process.exit(1);
});
