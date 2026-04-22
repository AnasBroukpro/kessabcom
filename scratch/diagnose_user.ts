/**
 * diagnose_user.ts
 * ================
 * Diagnose a specific phone number — checks Auth + Firestore sync
 * Usage: npx tsx scratch/diagnose_user.ts
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const auth = admin.auth();
const db = admin.firestore();

function getEmail(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('212')) clean = clean.substring(3);
  if (clean.startsWith('0')) clean = clean.substring(1);
  return `${clean}@kessabcom.ma`;
}

function getFormattedPhone(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('212')) clean = clean.substring(3);
  if (clean.startsWith('0')) clean = clean.substring(1);
  return `+212${clean}`;
}

async function diagnose(phone: string) {
  const email = getEmail(phone);
  const formatted = getFormattedPhone(phone);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🔍 Diagnosing: ${phone}`);
  console.log(`   Email format : ${email}`);
  console.log(`   Phone format : ${formatted}`);
  console.log(`${'─'.repeat(60)}`);

  // ─── Check Firebase Auth ───────────────────────────────────────
  let authUser: admin.auth.UserRecord | null = null;
  try {
    authUser = await auth.getUserByEmail(email);
    console.log('\n📌 Firebase Auth:');
    console.log(`   ✅ EXISTS — UID: ${authUser.uid}`);
    console.log(`   Email     : ${authUser.email}`);
    console.log(`   Created   : ${authUser.metadata.creationTime}`);
    console.log(`   Last sign : ${authUser.metadata.lastSignInTime || 'Never'}`);
    console.log(`   Disabled  : ${authUser.disabled}`);
  } catch (e: any) {
    if (e.code === 'auth/user-not-found') {
      console.log('\n📌 Firebase Auth:');
      console.log(`   ❌ NOT FOUND — No Auth account for ${email}`);
    } else {
      console.log(`   ⚠️  Auth error: ${e.message}`);
    }
  }

  // ─── Check Firestore by UID ────────────────────────────────────
  if (authUser) {
    const fsDoc = await db.collection('users').doc(authUser.uid).get();
    console.log('\n📌 Firestore (by UID):');
    if (fsDoc.exists) {
      const d = fsDoc.data()!;
      console.log(`   ✅ EXISTS`);
      console.log(`   Role      : ${d.role || '⚠️  MISSING!'}`);
      console.log(`   Phone     : ${d.phoneNumber || '⚠️  MISSING!'}`);
      console.log(`   Name      : ${d.fullName || d.displayName || '⚠️  MISSING!'}`);
      console.log(`   Status    : ${d.status || 'unknown'}`);

      if (!d.role) {
        console.log('\n   ⚠️  ISSUE: role is missing! This causes the "new user" loop.');
        console.log('   🔧 FIX: Setting role to "buyer" (can be changed in admin)...');
        await db.collection('users').doc(authUser.uid).update({ role: 'buyer', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        console.log('   ✅ Role fixed!');
      }

      if (!d.phoneNumber) {
        console.log(`\n   ⚠️  ISSUE: phoneNumber field is missing in Firestore!`);
        console.log('   🔧 FIX: Writing phoneNumber...');
        await db.collection('users').doc(authUser.uid).update({ phoneNumber: formatted, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        console.log('   ✅ phoneNumber fixed!');
      }
    } else {
      console.log(`   ❌ NOT FOUND — Firestore doc missing for UID ${authUser.uid}`);
      console.log('   🔧 FIX: Creating Firestore profile...');
      await db.collection('users').doc(authUser.uid).set({
        uid: authUser.uid,
        email,
        phoneNumber: formatted,
        role: 'buyer',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log('   ✅ Profile created with role "buyer"');
    }
  }

  // ─── Check Firestore by Phone ──────────────────────────────────
  console.log('\n📌 Firestore (by phoneNumber field):');
  const phoneVariants = [formatted, phone, `0${formatted.slice(4)}`];
  const phoneSnap = await db.collection('users').where('phoneNumber', 'in', phoneVariants).limit(3).get();

  if (phoneSnap.empty) {
    console.log(`   ❌ NOT FOUND — No doc with phoneNumber in ${JSON.stringify(phoneVariants)}`);
  } else {
    phoneSnap.forEach(doc => {
      const d = doc.data();
      console.log(`   ✅ Found doc UID: ${doc.id}`);
      console.log(`      Role  : ${d.role}`);
      console.log(`      Phone : ${d.phoneNumber}`);
      console.log(`      Name  : ${d.fullName || d.displayName}`);
    });
  }
}

async function main() {
  // Diagnose the phone number from the screenshot
  await diagnose('0611225544');

  // Also diagnose the previously used test numbers
  await diagnose('0611442064');

  console.log('\n' + '═'.repeat(60));
  console.log('  Diagnosis complete.');
  console.log('═'.repeat(60) + '\n');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
